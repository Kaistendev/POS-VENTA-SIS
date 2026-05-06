import { useEffect } from 'react';

type ShortcutConfig = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  description?: string;
};

export function useKeyboardShortcut(shortcuts: ShortcutConfig[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase() ||
                       e.key === shortcut.key;
        
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !shortcut.ctrl || !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !shortcut.shift || !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !shortcut.alt || !e.altKey;
        
        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.handler(e);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts() {
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'F2',
      handler: () => {
        if (window.location.hash !== '#/sales') {
          window.location.hash = '#/sales';
        }
      },
      description: 'Ir a Ventas',
    },
    {
      key: 'F3',
      handler: () => {
        const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      },
      description: 'Búsqueda rápida',
    },
    {
      key: 'F4',
      handler: () => {
        if (window.location.hash !== '#/cash') {
          window.location.hash = '#/cash';
        }
      },
      description: 'Ir a Caja',
    },
    {
      key: 'Escape',
      handler: () => {
        // Close any open modals by clicking cancel buttons
        const closeButtons = document.querySelectorAll('[aria-label*="Close"], button[class*="close"], .modal-close');
        if (closeButtons.length > 0) {
          (closeButtons[closeButtons.length - 1] as HTMLElement).click();
        }
      },
      description: 'Cerrar modal',
    },
  ];

  useKeyboardShortcut(shortcuts);
}
