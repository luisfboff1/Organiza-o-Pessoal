'use client';

import { useBreakpoint, Breakpoint } from './useBreakpoint';

export type ResponsiveValueMap<T> = {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
};

export function useResponsiveValue<T>(values: ResponsiveValueMap<T>): T {
  const breakpoint = useBreakpoint();

  // Return breakpoint-specific value or fall back to default
  return values[breakpoint] ?? values.default;
}
