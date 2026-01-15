import type { AppSettings } from '@/types/database'

/**
 * Default logo URL (ACA horizontal white logo)
 */
export const DEFAULT_LOGO_URL = 'https://www.aldersgatechristian.com/wp-content/uploads/2017/12/ACA-Logo_Horizontal_White_small.png'

/**
 * Gets the logo URL from settings or returns the default
 */
export function getLogoUrl(settings: AppSettings): string {
  return settings.school_logo_url || DEFAULT_LOGO_URL
}
