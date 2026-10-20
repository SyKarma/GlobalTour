import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Replaces the operating system's dropdown list of every native <select>
 * with a styled GlobalTour list, without touching each form.
 *
 * The <select> itself stays in the page (so its existing CSS, value and
 * React onChange keep working); only the popup that opens is ours.
 * On touch screens the native picker is kept because it is easier to use.
 */

type OptionItem = {
  value: string;
  label: string;
  disabled: boolean;
};

type OpenState = {
  select: HTMLSelectElement;
  options: OptionItem[];
  activeIndex: number;
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'down' | 'up';
};

const MIN_WIDTH = 180;
const GAP = 6;
const VIEWPORT_MARGIN = 12;
const PREFERRED_MAX_HEIGHT = 320;

function canEnhance(target: EventTarget | null): target is HTMLSelectElement {
  return (
    target instanceof HTMLSelectElement &&
    !target.disabled &&
    !target.multiple &&
    target.size <= 1 &&
    !target.hasAttribute('data-native-select')
  );
}

function prefersNativePicker(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: coarse)').matches === true
  );
}

function readOptions(select: HTMLSelectElement): OptionItem[] {
  return Array.from(select.options).map((option) => ({
    value: option.value,
    label: option.label || option.text,
    disabled: option.disabled,
  }));
}

function computePosition(select: HTMLSelectElement, count: number) {
  const rect = select.getBoundingClientRect();
  const estimated = Math.min(PREFERRED_MAX_HEIGHT, count * 42 + 12);
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
  const spaceAbove = rect.top - VIEWPORT_MARGIN;
  const placement: 'down' | 'up' =
    spaceBelow >= estimated || spaceBelow >= spaceAbove ? 'down' : 'up';
  const maxHeight = Math.max(
    140,
    Math.min(
      PREFERRED_MAX_HEIGHT,
      (placement === 'down' ? spaceBelow : spaceAbove) - GAP,
    ),
  );
  const width = Math.max(rect.width, MIN_WIDTH);
  const left = Math.min(
    Math.max(VIEWPORT_MARGIN, rect.left),
    window.innerWidth - width - VIEWPORT_MARGIN,
  );
  const top =
    placement === 'down' ? rect.bottom + GAP : rect.top - GAP;

  return { top, left, width, maxHeight, placement };
}

function setNativeValue(select: HTMLSelectElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLSelectElement.prototype,
    'value',
  )?.set;
  setter?.call(select, value);
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
}

function nextEnabled(
  options: OptionItem[],
  from: number,
  step: 1 | -1,
): number {
  let index = from;
  for (let i = 0; i < options.length; i += 1) {
    index = (index + step + options.length) % options.length;
    if (!options[index].disabled) {
      return index;
    }
  }
  return from;
}

function SelectEnhancer() {
  const [state, setState] = useState<OpenState | null>(null);
  const stateRef = useRef<OpenState | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  stateRef.current = state;

  const close = useCallback((refocus = true) => {
    const current = stateRef.current;
    setState(null);
    if (refocus && current) {
      current.select.focus({ preventScroll: true });
    }
  }, []);

  const open = useCallback((select: HTMLSelectElement) => {
    const options = readOptions(select);
    if (options.length === 0) {
      return;
    }
    const selected = Math.max(0, select.selectedIndex);
    setState({
      select,
      options,
      activeIndex: options[selected]?.disabled
        ? nextEnabled(options, selected, 1)
        : selected,
      ...computePosition(select, options.length),
    });
  }, []);

  const choose = useCallback(
    (index: number) => {
      const current = stateRef.current;
      if (!current) {
        return;
      }
      const option = current.options[index];
      if (!option || option.disabled) {
        return;
      }
      if (current.select.value !== option.value) {
        setNativeValue(current.select, option.value);
      }
      close();
    },
    [close],
  );

  // Open our list instead of the native one.
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (event.button !== 0 || prefersNativePicker()) {
        return;
      }
      if (!canEnhance(event.target)) {
        return;
      }
      event.preventDefault();
      const select = event.target;
      select.focus({ preventScroll: true });
      if (stateRef.current?.select === select) {
        close(false);
      } else {
        open(select);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const current = stateRef.current;

      if (current) {
        const { options, activeIndex } = current;
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault();
            setState({
              ...current,
              activeIndex: nextEnabled(options, activeIndex, 1),
            });
            return;
          case 'ArrowUp':
            event.preventDefault();
            setState({
              ...current,
              activeIndex: nextEnabled(options, activeIndex, -1),
            });
            return;
          case 'Home':
            event.preventDefault();
            setState({
              ...current,
              activeIndex: nextEnabled(options, -1, 1),
            });
            return;
          case 'End':
            event.preventDefault();
            setState({
              ...current,
              activeIndex: nextEnabled(options, options.length, -1),
            });
            return;
          case 'Enter':
          case ' ':
            event.preventDefault();
            choose(activeIndex);
            return;
          case 'Escape':
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          case 'Tab':
            close(false);
            return;
          default:
            if (event.key.length === 1) {
              const letter = event.key.toLowerCase();
              const match = options.findIndex(
                (option, index) =>
                  index > activeIndex &&
                  !option.disabled &&
                  option.label.toLowerCase().startsWith(letter),
              );
              const fallback = options.findIndex(
                (option) =>
                  !option.disabled &&
                  option.label.toLowerCase().startsWith(letter),
              );
              const found = match >= 0 ? match : fallback;
              if (found >= 0) {
                setState({ ...current, activeIndex: found });
              }
            }
            return;
        }
      }

      if (prefersNativePicker() || !canEnhance(event.target)) {
        return;
      }
      const opensList =
        event.key === ' ' ||
        event.key === 'Enter' ||
        event.key === 'F4' ||
        (event.altKey &&
          (event.key === 'ArrowDown' || event.key === 'ArrowUp'));
      if (opensList) {
        event.preventDefault();
        open(event.target);
      }
    };

    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [choose, close, open]);

  // Close when clicking elsewhere, scrolling the page or resizing.
  useEffect(() => {
    if (!state) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (listRef.current?.contains(target) || target === state.select)
      ) {
        return;
      }
      close(false);
    };

    const onScroll = (event: Event) => {
      if (
        event.target instanceof Node &&
        listRef.current?.contains(event.target)
      ) {
        return;
      }
      close(false);
    };

    const onResize = () => close(false);

    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [state, close]);

  // Keep the highlighted option visible.
  useEffect(() => {
    if (!state || !listRef.current) {
      return;
    }
    const item = listRef.current.children[state.activeIndex] as
      | HTMLElement
      | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [state]);

  if (!state) {
    return null;
  }

  const selectedValue = state.select.value;
  const listId = 'gt-select-popup';

  return createPortal(
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={
        state.select.getAttribute('aria-label') ??
        state.select.labels?.[0]?.textContent?.trim() ??
        undefined
      }
      className={`gt-select-popup gt-select-popup-${state.placement}`}
      style={{
        top: state.placement === 'down' ? state.top : undefined,
        bottom:
          state.placement === 'up'
            ? window.innerHeight - state.top
            : undefined,
        left: state.left,
        width: state.width,
        maxHeight: state.maxHeight,
      }}
    >
      {state.options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        const isActive = index === state.activeIndex;
        return (
          <li
            key={`${option.value}-${index}`}
            role="option"
            aria-selected={isSelected}
            aria-disabled={option.disabled || undefined}
            className={[
              'gt-select-option',
              isSelected ? 'is-selected' : '',
              isActive ? 'is-active' : '',
              option.disabled ? 'is-disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => {
              if (!option.disabled && stateRef.current) {
                setState({ ...stateRef.current, activeIndex: index });
              }
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              choose(index);
            }}
          >
            <span className="gt-select-option-label">{option.label}</span>
            {isSelected && (
              <svg
                className="gt-select-option-check"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            )}
          </li>
        );
      })}
    </ul>,
    document.body,
  );
}

export default SelectEnhancer;
