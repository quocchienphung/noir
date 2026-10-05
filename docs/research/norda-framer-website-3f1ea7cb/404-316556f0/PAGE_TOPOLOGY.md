# `/404` and unknown routes — page topology (page key `404-316556f0`)

Route files: `src/app/404/page.tsx` (calls `notFound()`), `src/app/not-found.tsx` (renders `NotFoundView`). Any unknown path or unknown CMS slug returns HTTP 404 with this view.

| # | Section | Component | Notes |
| --- | --- | --- | --- |
| 1 | 100vh white panel: "404" digits block (726×320 at 1440, anchored at 49% then −50%), message, "BACK TO HOMEPAGE" link | `NotFoundView` | pointer-reactive shadows |
| 2 | Footer | `SiteFooter` | — |

Behaviors (M): two black copies of "404" at 16% opacity (blur 16px / 4px) shift opposite to the pointer by up to 80px / 20px at the viewport edges, eased toward the target (I); at rest they sit under the digits. Touch/keyboard: static. Verified: `qa-behaviors` 404 checks for `/404`, `/not-a-page`, and unknown project/team/job/news slugs.
