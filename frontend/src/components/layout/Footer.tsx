import { Link } from 'react-router-dom'
import { Crosses, frame, gutter, inset } from '@/components/frame'
import { CASCADIA_URL, CATALOG_REPO_URL } from '@/lib/brand'
import { cn } from '@/lib/utils'

/** The footer rule sits inside the frame, so the page's bottom corners get registration marks too. */
export function Footer() {
  return (
    <footer>
      <div className={gutter}>
        <div className={frame}>
          <div className="relative -mt-px border-t">
            <Crosses />
            <div className={cn(inset, 'flex flex-col gap-3 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between')}>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link to="/about" className="hover:text-foreground">About</Link>
                <Link to="/guidelines" className="hover:text-foreground">Guidelines</Link>
                <a href={CATALOG_REPO_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">Catalog on GitHub</a>
              </div>
              <div className="flex items-center gap-2">
                <span>Powered by</span>
                <a href={CASCADIA_URL} target="_blank" rel="noreferrer" className="inline-flex items-center">
                  <img src="/logos/cascadia-wordmark.svg" alt="Cascadia" className="h-5 w-auto" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
