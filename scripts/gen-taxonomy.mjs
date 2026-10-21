#!/usr/bin/env node
/**
 * Generates src/types/taxonomy.generated.ts from taxonomy.json.
 *
 * TypeScript cannot derive a string-literal union from a JSON import -- JSON
 * imports widen to `string` -- so the literal list has to exist as TS source.
 * Generating it is the only way to keep taxonomy.json the single source of
 * truth while still getting a real union type.
 *
 *   node scripts/gen-taxonomy.mjs          rewrite the generated file
 *   node scripts/gen-taxonomy.mjs --check  exit 1 if it is stale (used by lint)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const taxonomy = JSON.parse(readFileSync(resolve(root, 'taxonomy.json'), 'utf8'));
const out = resolve(root, 'src/types/taxonomy.generated.ts');

const names = taxonomy.domains.map((d) => d.domain);
if (new Set(names).size !== names.length) {
  console.error('[gen-taxonomy] duplicate domain names in taxonomy.json');
  process.exit(1);
}

const body = `// GENERATED FILE -- DO NOT EDIT.
// Source: taxonomy.json. Regenerate with \`npm run taxonomy:gen\`.
// \`npm run lint\` fails if this file is stale.

export const OPERATIONAL_DOMAINS = [
${names.map((n) => `  '${n.replace(/'/g, "\\'")}',`).join('\n')}
] as const;

export type OperationalDomain = (typeof OPERATIONAL_DOMAINS)[number];
`;

const check = process.argv.includes('--check');
let current = null;
try {
  current = readFileSync(out, 'utf8');
} catch {
  /* missing counts as stale */
}

if (check) {
  if (current !== body) {
    console.error('[gen-taxonomy] src/types/taxonomy.generated.ts is stale.');
    console.error('[gen-taxonomy] Run: npm run taxonomy:gen');
    process.exit(1);
  }
  console.log('[gen-taxonomy] generated taxonomy is in sync');
} else {
  writeFileSync(out, body);
  console.log(`[gen-taxonomy] wrote ${names.length} domains to src/types/taxonomy.generated.ts`);
}
