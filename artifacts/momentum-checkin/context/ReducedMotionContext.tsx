import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

const ReducedMotionContext = createContext<boolean | null>(null);

export function ReducedMotionProvider({ children }: React.PropsWithChildren) {
  const [reduceMotion, setReduceMotion] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <ReducedMotionContext.Provider value={reduceMotion}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

/**
 * Returns null until the system preference has been read. Callers should use
 * the low-motion option while the value is unknown to avoid an animated flash.
 */
export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}

export function getMotionAwareAnimation<T extends string>(
  reduceMotion: boolean | null,
  defaultAnimation: T,
): T | 'none' {
  return reduceMotion === false ? defaultAnimation : 'none';
}
