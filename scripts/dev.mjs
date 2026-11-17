#!/usr/bin/env node
/**
 * Runs the API and the Vite dev server together, so `npm run dev` gives one
 * live preview with the frontend proxying /api to the backend.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = [];
let shuttingDown = false;

function run(name, args, colour) {
  const child = spawn(npm, args, {
    cwd: root,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  const prefix = `\x1b[${colour}m[${name}]\x1b[0m `;
  const forward = (stream, target) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      for (const line of chunk.split('\n')) {
        if (line.trim()) target.write(prefix + line + '\n');
      }
    });
  };

  forward(child.stdout, process.stdout);
  forward(child.stderr, process.stderr);

  child.on('exit', (code) => {
    if (shuttingDown) return;
    console.error(`${prefix}exited with code ${code}`);
    shutdown(code ?? 1);
  });

  children.push(child);
  return child;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('api', ['--workspace', 'server', 'run', 'dev'], '32');
run('web', ['--workspace', 'web', 'run', 'dev'], '35');
