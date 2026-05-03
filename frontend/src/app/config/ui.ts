import type { AppView } from '../../shared/types/ui'

export const APP_VIEWS: AppView[] = ['BOOKING', 'ROOMS', 'MODERATOR']

export const APP_UI_CLASSES = {
  panelClass: 'u-surface-elevated p-5 sm:p-6 md:p-8',
  inputClass:
    'w-full u-border-strong bg-bg-surface px-4 py-2.5 min-h-11 text-sm text-text-primary outline-none focus:ring-2 focus:ring-brand-accent shadow-raised transition-shadow',
  labelClass: 'mb-2 inline-block u-label-accent text-xs sm:text-sm font-semibold'
}

