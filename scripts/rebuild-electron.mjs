import { execSync } from 'child_process';
import { existsSync, readFileSync, copyFileSync, unlinkSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(__dirname, '..');
const arch = process.arch === 'arm64' ? 'arm64' : 'x64';

const nodeModulePath = join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node');
const backupPath = join(root, '.better-sqlite3.node.backup');

function getElectronVersion() {
  const pkg = JSON.parse(readFileSync(join(root, 'node_modules', 'electron', 'package.json'), 'utf8'));
  return pkg.version;
}

function backupNodeBinary() {
  if (!existsSync(nodeModulePath)) {
    console.log('No better_sqlite3.node found to backup');
    return false;
  }
  copyFileSync(nodeModulePath, backupPath);
  console.log('Backed up Node.js better_sqlite3.node');
  return true;
}

function restoreNodeBinary() {
  if (!existsSync(backupPath)) {
    console.log('No backup found');
    return false;
  }
  copyFileSync(backupPath, nodeModulePath);
  unlinkSync(backupPath);
  console.log('Restored Node.js better_sqlite3.node from backup');
  return true;
}

function rebuildFor(target) {
  const moduleDir = join(root, 'node_modules', 'better-sqlite3');
  if (!existsSync(join(moduleDir, 'binding.gyp'))) {
    console.log('better-sqlite3 not found, skipping rebuild');
    return;
  }

  let targetVersion, targetName, distUrl;
  if (target === 'node') {
    targetVersion = process.versions.node;
    targetName = 'node';
    distUrl = 'https://nodejs.org/dist';
  } else {
    targetVersion = target;
    targetName = 'electron';
    distUrl = 'https://electronjs.org/headers';
  }

  console.log(`Rebuilding better-sqlite3 for ${targetName} ${targetVersion}...`);
  execSync('npx node-gyp rebuild --release', {
    cwd: moduleDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      npm_config_target: targetVersion,
      npm_config_arch: arch,
      npm_config_disturl: distUrl,
      npm_config_runtime: targetName,
      npm_config_build_from_source: 'true',
      npm_config_devdir: join(process.env.USERPROFILE || process.env.HOME, '.node-gyp', 'Cache'),
    },
  });
}

const mode = process.argv[2];
const electronVersion = getElectronVersion();

if (mode === 'electron') {
  backupNodeBinary();
  rebuildFor(electronVersion);
} else if (mode === 'restore') {
  if (!restoreNodeBinary()) {
    rebuildFor('node');
  }
} else {
  console.log('Usage: node scripts/rebuild-electron.mjs [electron|restore]');
  process.exit(1);
}
