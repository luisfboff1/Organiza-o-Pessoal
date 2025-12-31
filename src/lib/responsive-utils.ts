import { Breakpoint } from '@/hooks/useBreakpoint';

export function getResponsiveChartHeight(
  breakpoint: Breakpoint,
  customHeight?: number
): number {
  if (customHeight) return customHeight;

  const heights: Record<Breakpoint, number> = {
    xs: 200,
    sm: 250,
    md: 300,
    lg: 350,
    xl: 400,
  };

  return heights[breakpoint];
}

export function getResponsiveGridCols(
  breakpoint: Breakpoint,
  options?: {
    maxCols?: number;
    minCols?: number;
  }
): number {
  const maxCols = options?.maxCols ?? 5;
  const minCols = options?.minCols ?? 1;

  const cols: Record<Breakpoint, number> = {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: maxCols,
  };

  return Math.max(minCols, Math.min(cols[breakpoint], maxCols));
}

export function getResponsiveSpacing(breakpoint: Breakpoint): {
  padding: string;
  gap: string;
  margin: string;
} {
  const spacing = {
    xs: { padding: 'p-3', gap: 'gap-3', margin: 'm-3' },
    sm: { padding: 'p-3', gap: 'gap-3', margin: 'm-3' },
    md: { padding: 'p-4', gap: 'gap-4', margin: 'm-4' },
    lg: { padding: 'p-6', gap: 'gap-6', margin: 'm-6' },
    xl: { padding: 'p-6', gap: 'gap-6', margin: 'm-6' },
  };

  return spacing[breakpoint];
}

export function getResponsiveTextSize(breakpoint: Breakpoint): {
  base: string;
  heading: string;
  small: string;
} {
  const sizes = {
    xs: { base: 'text-sm', heading: 'text-lg', small: 'text-xs' },
    sm: { base: 'text-sm', heading: 'text-xl', small: 'text-xs' },
    md: { base: 'text-base', heading: 'text-xl', small: 'text-sm' },
    lg: { base: 'text-base', heading: 'text-2xl', small: 'text-sm' },
    xl: { base: 'text-base', heading: 'text-2xl', small: 'text-sm' },
  };

  return sizes[breakpoint];
}
