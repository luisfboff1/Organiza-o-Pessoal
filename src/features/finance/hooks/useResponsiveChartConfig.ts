'use client';

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useEffect, useState } from 'react';

export interface ResponsiveChartConfig {
  height: number;
  pieRadius: number;
  fontSize: {
    label: number;
    tooltip: number;
    legend: number;
    axis: number;
  };
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showLegend: boolean;
  showGrid: boolean;
}

export function useResponsiveChartConfig(
  customHeight?: number,
  options?: {
    forceShowLegend?: boolean;
    forceShowGrid?: boolean;
  }
): ResponsiveChartConfig {
  const breakpoint = useBreakpoint();
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const updateWidth = () => setContainerWidth(window.innerWidth);
    updateWidth();

    const debouncedUpdate = debounce(updateWidth, 150);
    window.addEventListener('resize', debouncedUpdate);

    return () => window.removeEventListener('resize', debouncedUpdate);
  }, []);

  // Base configurations per breakpoint
  const configs: Record<string, ResponsiveChartConfig> = {
    xs: {
      height: customHeight ?? 200,
      pieRadius: Math.min(containerWidth * 0.25, 60),
      fontSize: { label: 10, tooltip: 11, legend: 10, axis: 10 },
      margin: { top: 10, right: 10, bottom: 20, left: 10 },
      showLegend: options?.forceShowLegend ?? false,
      showGrid: options?.forceShowGrid ?? true,
    },
    sm: {
      height: customHeight ?? 250,
      pieRadius: Math.min(containerWidth * 0.2, 70),
      fontSize: { label: 11, tooltip: 12, legend: 11, axis: 11 },
      margin: { top: 15, right: 15, bottom: 25, left: 15 },
      showLegend: options?.forceShowLegend ?? true,
      showGrid: options?.forceShowGrid ?? true,
    },
    md: {
      height: customHeight ?? 300,
      pieRadius: Math.min(containerWidth * 0.15, 80),
      fontSize: { label: 12, tooltip: 13, legend: 12, axis: 12 },
      margin: { top: 20, right: 20, bottom: 30, left: 20 },
      showLegend: options?.forceShowLegend ?? true,
      showGrid: options?.forceShowGrid ?? true,
    },
    lg: {
      height: customHeight ?? 350,
      pieRadius: 90,
      fontSize: { label: 12, tooltip: 14, legend: 12, axis: 12 },
      margin: { top: 20, right: 30, bottom: 30, left: 30 },
      showLegend: true,
      showGrid: true,
    },
    xl: {
      height: customHeight ?? 400,
      pieRadius: 100,
      fontSize: { label: 13, tooltip: 14, legend: 13, axis: 12 },
      margin: { top: 20, right: 30, bottom: 30, left: 40 },
      showLegend: true,
      showGrid: true,
    },
  };

  return configs[breakpoint] || configs.md;
}

// Debounce helper to prevent excessive re-renders
function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
