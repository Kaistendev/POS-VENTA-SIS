import { existsSync, mkdirSync, copyFileSync, readdirSync, statSync, readlinkSync, symlinkSync, unlinkSync, rmSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const targetDir = resolve(root, 'node_modules', '.prisma', 'client');

if (existsSync(targetDir)) {
  const entries = readdirSync(targetDir);
  if (entries.length > 0) process.exit(0);
}

const prismaClientPkg = resolve(root, 'node_modules', '@prisma', 'client');
if (!existsSync(prismaClientPkg)) {
  process.exit(1);
}

const prismaClientRealPath = resolve(dirname(prismaClientPkg), readlinkSync(prismaClientPkg));
const generatedClientDir = resolve(prismaClientRealPath, '..', '..', '.prisma', 'client');

if (existsSync(generatedClientDir)) {
  mkdirSync(resolve(root, 'node_modules', '.prisma'), { recursive: true });
  try {
    symlinkSync(generatedClientDir, targetDir, 'junction');
  } catch {
    try {
      copyRecursiveSync(generatedClientDir, targetDir);
    } catch {}
  }
}

function copyRecursiveSync(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyRecursiveSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}
