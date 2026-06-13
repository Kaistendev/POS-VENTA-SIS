import path from 'path';

export function isPathWithin(base: string, target: string): boolean {
  const resolvedBase = path.resolve(base);
  const resolvedTarget = path.resolve(target);
  return resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep);
}

export function assertPathWithin(base: string, target: string, label?: string): void {
  if (!isPathWithin(base, target)) {
    throw new Error(
      `${label || 'Ruta'} no válida: debe estar dentro del directorio permitido`
    );
  }
}
