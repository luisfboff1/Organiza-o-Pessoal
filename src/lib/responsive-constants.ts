export const RESPONSIVE_SPACING = {
  // Mobile-first approach
  container: 'p-3 md:p-4 lg:p-6',
  card: 'p-3 sm:p-4',
  gap: 'gap-3 md:gap-4 lg:gap-6',
  section: 'space-y-4 md:space-y-6',
  grid: 'gap-3 sm:gap-4',
} as const;

export const RESPONSIVE_TEXT = {
  heading: 'text-lg sm:text-xl md:text-2xl',
  subheading: 'text-base sm:text-lg',
  body: 'text-sm md:text-base',
  small: 'text-xs sm:text-sm',
  label: 'text-xs sm:text-sm font-medium',
} as const;

export const RESPONSIVE_BUTTON = {
  // Icon-only on mobile, text on desktop
  iconText: 'gap-0 sm:gap-2',
  hideTextMobile: 'hidden sm:inline',
} as const;

export const TOUCH_TARGET = {
  // Minimum 44x44px for touch
  minHeight: 'min-h-[44px]',
  minWidth: 'min-w-[44px]',
  button: 'min-h-[44px] px-4',
} as const;
