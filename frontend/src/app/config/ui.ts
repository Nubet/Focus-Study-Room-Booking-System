import type { AppView } from '../../shared/types/ui'

export const APP_VIEWS: AppView[] = ['BOOKING', 'ROOMS', 'MODERATOR']

export const APP_UI_CLASSES = {
  panelClass: 'bg-bg-surface brutal-border shadow-brutal p-4 sm:p-5 md:p-6',
  inputClass:
    'w-full brutal-border bg-bg-surface px-3 py-2.5 min-h-11 text-sm font-semibold text-text-primary outline-none focus:bg-brand-accent/20',
  labelClass: 'mb-1 block text-[11px] font-black tracking-wider uppercase'
}
