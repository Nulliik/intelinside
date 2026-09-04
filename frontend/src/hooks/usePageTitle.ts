import { useEffect } from 'react'
import { SITE_DESCRIPTION, pageTitle } from '@/lib/seo'

/** Sets the tab title ("Rigs | intelinside") and, when given, the page's meta description; otherwise the site-wide one. */
export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = pageTitle(title)
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = description ?? SITE_DESCRIPTION
  }, [title, description])
}
