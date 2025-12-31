'use client';

import { useBreakpoint } from './useBreakpoint';

export interface MobileDetect {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: string;
}

export function useMobileDetect(): MobileDetect {
  const breakpoint = useBreakpoint();

  return {
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    breakpoint,
  };
}
