import { useCallback, useRef, type MouseEvent } from 'react';

/**
 * Dismiss a modal only when both press and release happen on the backdrop.
 * Avoids closing when the user clicks inside, then drags out and releases.
 */
export function useBackdropDismiss(onDismiss: () => void, enabled = true) {
  const pressedOnBackdrop = useRef(false);

  const onMouseDown = useCallback((e: MouseEvent<HTMLElement>) => {
    pressedOnBackdrop.current = e.target === e.currentTarget;
  }, []);

  const onClick = useCallback(
    (e: MouseEvent<HTMLElement>) => {
      if (
        enabled &&
        pressedOnBackdrop.current &&
        e.target === e.currentTarget
      ) {
        onDismiss();
      }
      pressedOnBackdrop.current = false;
    },
    [enabled, onDismiss],
  );

  return { onMouseDown, onClick };
}
