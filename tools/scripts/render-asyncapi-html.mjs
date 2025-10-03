/**
 * Render AsyncAPI documents to static HTML using the official generator.
 *
 * The previous implementation relied on a CommonJS-style named export which
 * resolves to `undefined` when imported from an ESM context.  The generator
 * package exposes a default export instead, so we load it accordingly and keep
 * the rest of the script fully typed/annotated for future maintainers.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import os from 'node:os';
import { mkdtemp } from 'node:fs/promises';
import { rm } from 'node:fs/promises';
import YAML from 'yaml';
import AsyncAPIGenerator from '@asyncapi/generator';

async function main() {
  const [,, specPath, outputPath] = process.argv;
  if (!specPath || !outputPath) {
    console.error('Usage: node tools/scripts/render-asyncapi-html.mjs <spec.yaml> <output.html>');
    process.exit(1);
  }

  const resolvedSpec = path.resolve(specPath);
  const resolvedOutput = path.resolve(outputPath);

  const raw = await fs.readFile(resolvedSpec, 'utf8');
  YAML.parse(raw); // validate YAML before rendering

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'asyncapi-html-'));
  try {
    // The HTML template is vendored via package.json so we can disable on-demand
    // npm installs (which frequently fail in restricted build environments).
    const generator = new AsyncAPIGenerator('@asyncapi/html-template', tmpDir, {
      forceWrite: true,
      templateParams: {
        sidebarOrganization: 'byTags'
      }
    });
    await generator.generateFromFile(resolvedSpec);
    const htmlPath = path.join(tmpDir, 'index.html');
    try {
      await fs.access(htmlPath);
    } catch (accessError) {
      throw new Error(`AsyncAPI generator did not produce an index.html artifact at ${htmlPath}: ${accessError.message}`);
    }
    const html = await fs.readFile(htmlPath, 'utf8');
    await fs.mkdir(path.dirname(resolvedOutput), { recursive: true });
    await fs.writeFile(resolvedOutput, html, 'utf8');
    console.log(`Rendered AsyncAPI HTML to ${resolvedOutput}`);
  } finally {
    await rm(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Failed to render AsyncAPI HTML:', error);
  process.exit(1);
});
