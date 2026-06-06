import fs from 'node:fs';
import assert from 'node:assert/strict';

const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const rewrites = config.rewrites ?? [];

assert.ok(Array.isArray(rewrites), 'vercel.json rewrites must be an array');
assert.ok(!rewrites.some((rewrite) => rewrite.source === '/(.*)' && rewrite.destination === '/index.html'), 'unknown URLs must not rewrite to the homepage');

for (const route of ['/guides', '/privacy', '/about', '/terms', '/disclaimer', '/contact']) {
  assert.ok(rewrites.some((rewrite) => rewrite.source === route), `${route} support route should be explicitly rewritten`);
}

console.log('Vercel routing audit passed.');
