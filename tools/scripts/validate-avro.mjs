import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import avsc from 'avsc';

const { Type } = avsc;

const files = process.argv.slice(2).sort();

if (!files.length) {
  console.error('No Avro schema files provided.');
  process.exit(1);
}

const registry = Object.create(null);
const schemaMetadata = new Map();

for (const file of files) {
  const raw = await fs.readFile(file, 'utf8');
  const schema = JSON.parse(raw);
  try {
    const type = Type.forSchema(schema, { registry });
    registry[type.getName()] = type;
    schemaMetadata.set(file, { schema, type });
    console.log(`✔ Parsed ${file}`);
  } catch (err) {
    console.error(`Schema parse failure for ${file}: ${err.message}`);
    process.exit(1);
  }
}

const groups = new Map();
for (const file of files) {
  const baseName = path.basename(file).replace(/\.v\d+\.avsc$/, '');
  const versionMatch = file.match(/\.v(\d+)\.avsc$/);
  const version = versionMatch ? Number.parseInt(versionMatch[1], 10) : 1;
  const entry = groups.get(baseName) ?? [];
  entry.push({ file, version, schema: schemaMetadata.get(file).schema });
  groups.set(baseName, entry);
}

for (const [base, versions] of groups.entries()) {
  versions.sort((a, b) => a.version - b.version);
  for (let idx = 1; idx < versions.length; idx += 1) {
    const prev = versions[idx - 1];
    const curr = versions[idx];
    ensureBackwardCompatible(base, prev, curr);
  }
}

console.log('✔ Avro schema validation succeeded');

function ensureBackwardCompatible(base, prev, curr) {
  const prevFields = fieldMap(prev.schema);
  const currFields = fieldMap(curr.schema);

  for (const [name, def] of prevFields) {
    if (!currFields.has(name)) {
      fail(base, curr.file, `Missing field '${name}' required by ${prev.file}`);
    }
    const currDef = currFields.get(name);
    if (!schemaEquals(def.type, currDef.type)) {
      fail(base, curr.file, `Field '${name}' type changed between versions`);
    }
  }

  for (const [name, def] of currFields) {
    if (!prevFields.has(name) && typeof def.default === 'undefined') {
      fail(base, curr.file, `New field '${name}' introduced without default; breaks backward compatibility.`);
    }
  }
}

function fieldMap(schema) {
  if (schema.type !== 'record') {
    fail(schema.name ?? 'unknown', '<unknown>', 'Schema must be Avro record');
  }
  const map = new Map();
  for (const field of schema.fields ?? []) {
    map.set(field.name, field);
  }
  return map;
}

function schemaEquals(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function fail(base, file, message) {
  console.error(`Compatibility failure for ${base} in ${file}: ${message}`);
  process.exit(1);
}
