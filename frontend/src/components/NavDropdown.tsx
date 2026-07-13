import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface NavDropdownProps {
  label: ReactNode;
  icon?: ReactNode;
  active?: boolean;
  align?: 'left' | 'right';
  triggerClassName?: string;
  showChevron?: boolean;
  ariaLabel?: string;
  renderPanel: (close: () => void) => ReactNode;
}

/**
 * Accessible dropdown menu used for the navbar's Pretraga / Objavi / user menus.
 * Opens on click or Enter/Space/ArrowDown, closes on Escape (returning focus to the
 * trigger), on outside click, or when an item inside calls the `close` callback it
 * receives via renderPanel (items should call it in their own onClick before navigating).
 */
export default function NavDropdown({
  label,
  icon,
  active,
  align = 'left',
  triggerClassName,
  showChevron = true,
  ariaLabel,
  renderPanel,
}: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const focusItem = (index: number, items: HTMLElement[]) => {
    if (items.length === 0) return;
    const next = ((index % items.length) + items.length) % items.length;
    items[next]?.focus();
  };

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => {
        const items = Array.from(
          containerRef.current?.querySelectorAll<HTMLElement>('[data-dropdown-item]') ?? [],
        );
        focusItem(0, items);
      });
    }
  };

  const handlePanelKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(
      containerRef.current?.querySelectorAll<HTMLElement>('[data-dropdown-item]') ?? [],
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(idx + 1, items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusItem(idx - 1, items);
    }
  };

  return (
    <div className="nav-dropdown" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName ?? `nav-item${active ? ' active' : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
      >
        {icon}
        {label}
        {showChevron && <ChevronDownIcon size={13} />}
      </button>
      {open && (
        <div
          className={`nav-dropdown-panel${align === 'right' ? ' align-right' : ''}`}
          role="menu"
          onKeyDown={handlePanelKeyDown}
        >
          {renderPanel(close)}
        </div>
      )}
    </div>
  );
}
