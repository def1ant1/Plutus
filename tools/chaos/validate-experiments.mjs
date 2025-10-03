import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const experimentsDir = resolve(process.cwd(), 'chaos', 'experiments');
const files = readdirSync(experimentsDir).filter((file) => file.endsWith('.yaml'));

if (files.length === 0) {
  console.error('No chaos experiments found; add templates under chaos/experiments.');
  process.exit(1);
}

let failures = 0;

for (const file of files) {
  const contents = readFileSync(resolve(experimentsDir, file), 'utf-8');
  const doc = parse(contents) ?? {};

  const metadata = doc.metadata ?? {};
  const spec = doc.spec ?? {};

  if (!metadata.name) {
    console.error(`Experiment ${file} missing metadata.name`);
    failures += 1;
  }

  if (!metadata?.labels?.['observability.plutus.dev/slo']) {
    console.error(`Experiment ${file} missing observability SLO label`);
    failures += 1;
  }

  if (!metadata?.annotations?.['runbook.plutus.dev/execute']) {
    console.error(`Experiment ${file} missing execute runbook annotation`);
    failures += 1;
  }

  if (!spec.action && !spec.delay) {
    console.error(`Experiment ${file} missing spec.action or spec.delay definition`);
    failures += 1;
  }
}

if (failures > 0) {
  console.error(`Chaos experiment validation failed for ${failures} file(s).`);
  process.exit(1);
}

console.log(`Validated ${files.length} chaos experiment template(s).`);
