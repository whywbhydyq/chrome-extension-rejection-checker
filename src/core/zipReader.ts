import type {
  ScannerContext,
  ScanLimit,
  ScanProgress,
  VirtualFile,
} from "./types";
import {
  dirname,
  isProbablyText,
  makeVirtualFile,
  canonicalizePath,
  normalizePath,
} from "./virtualFileSystem";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_ENTRY_COUNT = 5000;
const MAX_TOTAL_UNCOMPRESSED_BYTES = 120 * 1024 * 1024;
const MAX_TEXT_FILE_BYTES = 1.5 * 1024 * 1024;
const MAX_BINARY_PREVIEW_BYTES = 2 * 1024 * 1024;
const YIELD_EVERY_ENTRIES = 25;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${Math.round((bytes / 1024 / 1024) * 10) / 10} MB`;
}

function pickManifestPath(paths: string[]): string | undefined {
  if (paths.includes("manifest.json")) return "manifest.json";
  return paths.find((path) => path.endsWith("/manifest.json"));
}

function shouldReadBytes(path: string, size: number | undefined): boolean {
  return (
    typeof size === "number" &&
    size <= MAX_BINARY_PREVIEW_BYTES &&
    /\.png$/i.test(path)
  );
}

function isImageMetadataCandidate(path: string): boolean {
  return /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(path);
}

function isCoreTextScanCandidate(path: string): boolean {
  return /\.(js|mjs|cjs|json|html|htm|css|svg)$/i.test(path);
}

function getDeclaredUncompressedSize(entry: unknown): number | undefined {
  const size = (entry as { _data?: { uncompressedSize?: number } })._data
    ?.uncompressedSize;
  return typeof size === "number" && Number.isFinite(size) && size >= 0
    ? size
    : undefined;
}

function getTextByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

function scanLimit(
  params: Omit<ScanLimit, "recommendation"> & { recommendation?: string },
): ScanLimit {
  return {
    ...params,
    recommendation:
      params.recommendation ??
      "Review this file manually in your submitted ZIP because the browser scanner intentionally skipped expensive content.",
  };
}

type ReadExtensionZipOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: ScanProgress) => void;
};

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException("Scan aborted.", "AbortError");
}

function yieldToMainThread(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

export async function readExtensionZip(
  file: File,
  options: ReadExtensionZipOptions = {},
): Promise<ScannerContext> {
  throwIfAborted(options.signal);
  if (!file.name.toLowerCase().endsWith(".zip"))
    throw new Error("Please choose a .zip file.");
  if (file.size > MAX_ZIP_BYTES) {
    throw new Error(
      `This ZIP is ${formatBytes(file.size)}. Choose a package under ${formatBytes(MAX_ZIP_BYTES)} so the browser scanner can run safely.`,
    );
  }

  options.onProgress?.({ phase: "loading_zip" });
  const { default: JSZip } = await import("jszip");
  throwIfAborted(options.signal);
  const zip = await JSZip.loadAsync(file);
  throwIfAborted(options.signal);
  const entryRecords = Object.values(zip.files)
    .filter((entry) => !entry.dir)
    .map((entry) => ({
      entry,
      pathInfo: canonicalizePath(entry.name),
      size: getDeclaredUncompressedSize(entry),
    }))
    .filter((record) => !record.pathInfo.path.startsWith("__MACOSX/"));

  if (entryRecords.length > MAX_ENTRY_COUNT) {
    throw new Error(
      `This ZIP contains ${entryRecords.length} files. The local scanner limit is ${MAX_ENTRY_COUNT} files to avoid freezing the browser.`,
    );
  }

  const knownTotalUncompressedSize = entryRecords.reduce<number>(
    (total, record) => total + (record.size ?? 0),
    0,
  );
  const hasUnknownDeclaredSize = entryRecords.some(
    (record) => record.size === undefined,
  );
  if (knownTotalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_BYTES) {
    throw new Error(
      `This ZIP expands to about ${formatBytes(knownTotalUncompressedSize)}. The local scanner limit is ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} to reduce zip-bomb risk.`,
    );
  }

  const rawPaths = entryRecords.map((record) => record.pathInfo.path);
  const manifestPath = pickManifestPath(rawPaths);
  const manifestAtRoot = manifestPath === "manifest.json";
  const rootPrefix =
    manifestPath && !manifestAtRoot ? dirname(manifestPath) : "";

  const scanLimits: ScanLimit[] = [];
  if (hasUnknownDeclaredSize) {
    scanLimits.push(
      scanLimit({
        code: "ZIP_DECLARED_SIZE_UNKNOWN",
        severity: "medium",
        title: "Some ZIP entry sizes were not declared",
        reason:
          "One or more ZIP entries did not expose a declared uncompressed size before reading. The browser scanner now treats unknown-size non-manifest entries as unsafe to decode automatically, because JSZip cannot enforce a streaming byte limit before allocation.",
        recommendation:
          "Repackage the extension with normal ZIP metadata or manually review skipped unknown-size files in the final submitted package.",
      }),
    );
  }

  for (const record of entryRecords) {
    if (record.pathInfo.hadTraversal || record.pathInfo.hadLeadingSlash) {
      scanLimits.push(
        scanLimit({
          code: record.pathInfo.escapedRoot ? "ZIP_ENTRY_ESCAPES_ROOT" : "ZIP_ENTRY_PATH_NORMALIZED",
          severity: record.pathInfo.escapedRoot ? "high" : "medium",
          title: record.pathInfo.escapedRoot ? "ZIP entry path escapes the package root" : "ZIP entry path was normalized before scanning",
          file: record.pathInfo.path,
          size: record.size,
          reason: `The ZIP entry ${record.entry.name} contained ${record.pathInfo.escapedRoot ? "parent-directory traversal" : "non-canonical path segments"}. The scanner uses ${record.pathInfo.path || "an empty path"} as the safe canonical path and reports this as a packaging risk.`,
          recommendation:
            "Repackage the extension with clean package-relative paths that do not contain leading slashes or .. segments.",
        }),
      );
    }
  }

  if (manifestPath) {
    const manifestRecord = entryRecords.find((record) => record.pathInfo.path === manifestPath);
    if (manifestRecord?.size === undefined) {
      throw new Error(
        "manifest.json was found, but its expanded size was not declared by the ZIP metadata. Repackage the extension and scan again so the browser scanner can avoid unsafe unknown-size decoding.",
      );
    }
  }

  const allFiles: VirtualFile[] = [];
  let observedReadBytes = 0;
  for (const [index, record] of entryRecords.entries()) {
    throwIfAborted(options.signal);
    const { entry, pathInfo } = record;
    const normalized = pathInfo.path;
    options.onProgress?.({
      phase: "reading_entries",
      processedEntries: index,
      totalEntries: entryRecords.length,
      currentFile: normalized,
    });
    if (index > 0 && index % YIELD_EVERY_ENTRIES === 0)
      await yieldToMainThread();
    let size = getDeclaredUncompressedSize(entry);
    let text: string | undefined;
    let bytes: Uint8Array | undefined;

    if (isProbablyText(normalized, size ?? MAX_TEXT_FILE_BYTES + 1)) {
      if (size === undefined) {
        scanLimits.push(
          scanLimit({
            code: "ZIP_TEXT_FILE_SKIPPED_UNKNOWN_SIZE",
            severity: isCoreTextScanCandidate(normalized) ? "medium" : "low",
            title: "Text file skipped because its expanded size was unknown",
            file: normalized,
            reason:
              "The ZIP entry did not expose a declared uncompressed size before reading. JSZip would need to allocate the whole expanded entry before the scanner could enforce a limit, so the file was not decoded automatically.",
            recommendation:
              "Repackage the extension with normal ZIP metadata or manually review this file in the final submitted package.",
          }),
        );
      } else if (size <= MAX_TEXT_FILE_BYTES) {
        try {
          const decodedText = await entry.async("text");
          throwIfAborted(options.signal);
          const actualTextSize = getTextByteLength(decodedText);
          observedReadBytes += actualTextSize;
          if (observedReadBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
            throw new Error(
              `This ZIP decoded more than ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} of text content. The local scanner stopped to reduce zip-bomb risk.`,
            );
          }
          if (actualTextSize <= MAX_TEXT_FILE_BYTES) {
            text = decodedText;
          } else {
            scanLimits.push(
              scanLimit({
                code: "ZIP_TEXT_FILE_SKIPPED_AFTER_DECODE",
                severity: "low",
                title: "Large text file skipped after size verification",
                file: normalized,
                size: actualTextSize,
                reason: `This file decoded to ${formatBytes(actualTextSize)}, above the ${formatBytes(MAX_TEXT_FILE_BYTES)} per-file text scan limit.`,
              }),
            );
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes("zip-bomb risk"))
            throw error;
          scanLimits.push(
            scanLimit({
              code: "ZIP_TEXT_READ_FAILED",
              severity: "low",
              title: "Text file could not be read",
              file: normalized,
              size,
              reason:
                "A probable text file inside the ZIP could not be decoded by the local browser scanner.",
            }),
          );
        }
      } else {
        scanLimits.push(
          scanLimit({
            code: "ZIP_TEXT_FILE_SKIPPED",
            severity: "low",
            title: "Large text file skipped",
            file: normalized,
            size,
            reason: `This file is ${formatBytes(size)}, above the ${formatBytes(MAX_TEXT_FILE_BYTES)} per-file text scan limit.`,
          }),
        );
      }
    }

    if (size === undefined && isImageMetadataCandidate(normalized)) {
      scanLimits.push(
        scanLimit({
          code: "ZIP_BINARY_SKIPPED_UNKNOWN_SIZE",
          severity: "low",
          title: "Image file skipped because its expanded size was unknown",
          file: normalized,
          reason:
            "The scanner did not decode image bytes without a declared expanded size. This avoids allocating unknown-size image entries before a safety limit can be enforced.",
          recommendation:
            "Repackage the extension with normal ZIP metadata or manually verify image dimensions and icon files.",
        }),
      );
    }

    if (shouldReadBytes(normalized, size)) {
      try {
        const decodedBytes = await entry.async("uint8array");
        throwIfAborted(options.signal);
        observedReadBytes += decodedBytes.byteLength;
        if (observedReadBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
          throw new Error(
            `This ZIP decoded more than ${formatBytes(MAX_TOTAL_UNCOMPRESSED_BYTES)} of content. The local scanner stopped to reduce zip-bomb risk.`,
          );
        }
        bytes = decodedBytes;
        size = size ?? decodedBytes.byteLength;
      } catch (error) {
        if (error instanceof Error && error.message.includes("zip-bomb risk"))
          throw error;
        scanLimits.push(
          scanLimit({
            code: "ZIP_BINARY_READ_FAILED",
            severity: "low",
            title: "Image or binary file could not be read",
            file: normalized,
            size,
            reason:
              "A file used for icon or asset checks could not be decoded by the local browser scanner.",
          }),
        );
      }
    }

    allFiles.push(
      makeVirtualFile({
        path: normalized,
        rootPrefix,
        size: size ?? 0,
        text,
        bytes,
      }),
    );
  }

  options.onProgress?.({
    phase: "running_rules",
    processedEntries: entryRecords.length,
    totalEntries: entryRecords.length,
  });

  const files = new Map<string, VirtualFile>();
  for (const virtualFile of allFiles)
    files.set(virtualFile.normalizedPath, virtualFile);

  const manifestFile = manifestPath
    ? allFiles.find((candidate) => candidate.path === manifestPath)
    : undefined;
  let manifest: Record<string, unknown> | undefined;
  let manifestParseError: string | undefined;

  if (manifestFile?.text) {
    try {
      const parsed = JSON.parse(manifestFile.text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        manifest = parsed as Record<string, unknown>;
      else manifestParseError = "manifest.json must contain a JSON object.";
    } catch (error) {
      manifestParseError =
        error instanceof Error ? error.message : "Invalid JSON.";
    }
  } else if (manifestPath) {
    manifestParseError =
      "manifest.json was found but could not be read by the local scanner.";
  }

  const textFiles = allFiles.filter(
    (candidate) => candidate.isText && candidate.text !== undefined,
  );
  const jsFiles = textFiles.filter((candidate) =>
    [".js", ".mjs", ".cjs"].includes(candidate.extension),
  );
  const htmlFiles = textFiles.filter((candidate) =>
    [".html", ".htm"].includes(candidate.extension),
  );

  return {
    zipName: file.name,
    manifestPath,
    manifestAtRoot,
    manifest,
    manifestParseError,
    rootPrefix,
    files,
    allFiles,
    textFiles,
    jsFiles,
    htmlFiles,
    scanLimits,
  };
}
