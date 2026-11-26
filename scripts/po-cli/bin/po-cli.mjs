#!/usr/bin/env node
// Load the TypeScript CLI through tsx so PageObjects and tsconfig path aliases
// (@app-impl, @pages/*, ...) resolve exactly as they do in the specs.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..', '..', '..');

const { register } = await import('tsx/esm/api');
register({ tsconfig: path.join(repoRoot, 'tsconfig.json') });

await import(pathToFileURL(path.join(here, '..', 'cli.ts')).href);
