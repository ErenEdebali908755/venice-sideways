import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Railway uses the Dockerfile and the image contains every local runtime import', async () => {
  const [dockerfile, railway] = await Promise.all([
    readFile(new URL('../Dockerfile', import.meta.url), 'utf8'),
    readFile(new URL('../railway.json', import.meta.url), 'utf8').then(JSON.parse),
  ]);
  assert.equal(railway.build.builder, 'DOCKERFILE');
  assert.equal(railway.build.dockerfilePath, 'Dockerfile');
  assert.equal(railway.deploy.healthcheckPath, '/healthz');
  const copied = new Set(dockerfile.split('\n').filter(line => /^COPY\s/.test(line))
    .flatMap(line => line.replace(/^COPY\s+(?:--\S+\s+)*/, '').trim().split(/\s+/).slice(0,-1)));
  assert.ok(copied.has('public'));
  assert.ok(copied.has('package.json'));
  const visited = new Set();
  async function visit(name) {
    if (visited.has(name)) return;
    visited.add(name);
    assert.ok(copied.has(name), `${name} is imported but missing from Docker COPY`);
    const source = await readFile(new URL(`../${name}`, import.meta.url), 'utf8');
    for (const match of source.matchAll(/\b(?:from\s*|import\s*)['"]\.\/([^'"]+\.mjs)['"]/g))
      await visit(match[1]);
  }
  await visit('server.mjs');
});
