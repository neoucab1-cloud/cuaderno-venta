const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const rootDir = path.resolve(__dirname, '..');
const isWindows = process.platform === 'win32';
const viteBin = path.join(rootDir, 'node_modules', '.bin', isWindows ? 'vite.cmd' : 'vite');
const electronBin = path.join(rootDir, 'node_modules', '.bin', isWindows ? 'electron.cmd' : 'electron');

function waitForServer(url, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    const tryConnect = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(tryConnect, 500);
      });
    };

    tryConnect();
  });
}

function startProcess(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, ...options.env },
    shell: process.platform === 'win32',
  });

  child.stdout.on('data', (data) => process.stdout.write(data));
  child.stderr.on('data', (data) => process.stderr.write(data));

  child.on('exit', (code) => {
    if (code && code !== 0) {
      process.exit(code);
    }
  });

  return child;
}

const vite = startProcess(viteBin, ['--port=3000', '--host=127.0.0.1']);

waitForServer('http://127.0.0.1:3000')
  .then(() => {
    const electron = startProcess(electronBin, ['.'], {
      env: { ...process.env, ELECTRON_DEV: 'true' },
    });

    electron.on('exit', (code) => {
      vite.kill('SIGTERM');
      process.exit(code ?? 0);
    });
  })
  .catch((error) => {
    console.error(error.message);
    vite.kill('SIGTERM');
    process.exit(1);
  });
