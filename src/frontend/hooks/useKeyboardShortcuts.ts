import { useEffect, useCallback } from 'react';

export interface Shortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const matchesShift = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
        const matchesAlt = shortcut.altKey ? event.altKey : !event.altKey;

        if (matchesKey && matchesCtrl && matchesShift && matchesAlt) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}

// Common shortcuts helper
export function useCommonShortcuts(handlers: {
  onSave?: () => void;
  onDelete?: () => void;
  onSearch?: () => void;
  onNew?: () => void;
  onPrint?: () => void;
  onRefresh?: () => void;
}) {
  const shortcuts: Shortcut[] = [];

  if (handlers.onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      handler: handlers.onSave,
      description: 'Guardar',
    });
  }

  if (handlers.onDelete) {
    shortcuts.push({
      key: 'Delete',
      handler: handlers.onDelete,
      description: 'Eliminar',
    });
  }

  if (handlers.onSearch) {
    shortcuts.push({
      key: 'f',
      ctrlKey: true,
      handler: handlers.onSearch,
      description: 'Buscar',
    });
  }

  if (handlers.onNew) {
    shortcuts.push({
      key: 'n',
      ctrlKey: true,
      handler: handlers.onNew,
      description: 'Nuevo',
    });
  }

  if (handlers.onPrint) {
    shortcuts.push({
      key: 'p',
      ctrlKey: true,
      handler: handlers.onPrint,
      description: 'Imprimir',
    });
  }

  if (handlers.onRefresh) {
    shortcuts.push({
      key: 'r',
      ctrlKey: true,
      handler: handlers.onRefresh,
      description: 'Refrescar',
    });
  }

  useKeyboardShortcuts(shortcuts);
}
