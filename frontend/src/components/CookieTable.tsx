import { COOKIE_CATEGORIES } from '@/lib/cookies'

/**
 * What each category actually stores, for the Privacy page. Reads the same catalog the preferences
 * dialog does, so the disclosed list is by construction the list the banner governs.
 */
export function CookieTable() {
  return (
    <div className="space-y-6">
      {COOKIE_CATEGORIES.map((cat) => (
        <div key={cat.key} className="space-y-2">
          <div className="text-sm font-medium text-foreground">{cat.label}</div>
          {cat.cookies.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing is stored in this category.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-label text-muted-foreground">Name</th>
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-label text-muted-foreground">Purpose</th>
                    <th className="px-3 py-2 text-xs font-medium uppercase tracking-label text-muted-foreground">Kept for</th>
                  </tr>
                </thead>
                <tbody>
                  {cat.cookies.map((cookie) => (
                    <tr key={cookie.name} className="border-b align-top last:border-b-0">
                      <td className="px-3 py-3">
                        <span className="block font-mono text-xs text-foreground">{cookie.name}</span>
                        <span className="block text-xs text-muted-foreground">{cookie.provider}</span>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{cookie.purpose}</td>
                      <td className="px-3 py-3 text-muted-foreground">{cookie.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
