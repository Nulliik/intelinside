import { useEffect } from 'react'
import { SITE_DESCRIPTION, pageTitle } from '@/lib/seo'

/**
 * Sets the tab title ("Rigs | Intelinside.ai", or brand first when asked) and, when given, the page's meta
 * description; otherwise the site-wide one.
 */
export function usePageTitle(title?: string, description?: string, brandFirst = false) {
  useEffect(() => {
    document.title = pageTitle(title, brandFirst)
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = description ?? SITE_DESCRIPTION
  }, [title, description, brandFirst])
}
