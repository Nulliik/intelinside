import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'
import { TopNav } from './TopNav'
import { Footer } from './Footer'
import { SignInDialog } from '@/components/SignInDialog'
import { frame, gutter } from '@/components/frame'
import { cn } from '@/lib/utils'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

/** The page frame: two vertical guides run the full height; sections draw rules between them. */
export function AppShell() {
  return (
    <TooltipProvider>
      <ScrollToTop />
      <a href="#main" className="sr-only z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to content
      </a>
      <div className="flex min-h-screen flex-col">
        <TopNav />
        <div className={cn('flex flex-1 flex-col', gutter)}>
          <main
            id="main"
            tabIndex={-1}
            className={cn(frame, 'flex-1 outline-none [&>div>section:last-child]:border-b [&>div>section:last-child>.crosses-bottom]:contents')}
          >
            <Outlet />
          </main>
        </div>
        <Footer />
      </div>
      <SignInDialog />
      <Toaster theme="dark" position="bottom-right" />
    </TooltipProvider>
  )
}
