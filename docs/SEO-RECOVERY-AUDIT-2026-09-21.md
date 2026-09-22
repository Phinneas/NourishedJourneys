# SEO Recovery Audit — 2026-09-21

Technical SEO repair for the August 2026 impression decline. Scope limited to
redirects, canonical URLs, internal links, sitemap integrity, and crawlability.
No articles were deleted, merged, renamed, or retitled.

Build/audit tooling: `pnpm build` (includes `astro check`), then
`node scripts/seo-audit.mjs` (exit code 0 = all checks pass).

---

## Changes made

### `public/_redirects` (restructured)

- Added the missing trailing-slash variant `/post/:slug/ -> /:slug/ 301`
  (previously only `/post/:slug` without the slash existed, so
  `/post/tummo-breathing/` was a 404 — one of the GSC "failed redirect" URLs).
- Added specific `/post/{slug}` and `/posts/{slug}` rules (both slash variants)
  for all 17 consolidated/deleted slugs, pointing **directly** at the final
  destination. Previously `/posts/how-to-brain-dump/` went
  `/posts/...` → `/how-to-brain-dump/` → `/brain-dump/` (2-hop chain, flagged
  by GSC for `/posts/adhd-brain-fog-emergency/`). All chains are now 1 hop.
- Moved the generic wildcards `/tag/:tag/` and `/tag/:tag/:page/` **below** the
  11 specific `/tag/...` rules so specific mappings win.
- Added a `/tags/* -> /category/ 301` splat fallback so any legacy `/tags/`
  variant resolves to the category index instead of a 404.
- `/adhd-brain-fog-emergency/` (and its `/post(s)/` variants) now redirect to
  `/brain-fog-meditation/` instead of the generic
  `/category/Mental%20Clarity/1/` category page — more relevant destination
  per the prior fix plan.
- Generic `/tag/` fallbacks still land on `/category/`, which is the real
  category index page (verified 200).

### Internal links (source)

- `src/components/RelatedPostsCard.astro` — related-posts cards linked through
  the `/posts/:slug/` redirect on every article page; now link directly to
  `/{slug}/`.
- `src/pages/index.astro` — homepage "Meditation" pillar linked to the
  redirected `/mindfulness-for-brain-fog-2/`; now `/mindfulness-for-brain-fog/`.
- `src/content/techniques/ujjayi.json` — `blogSlug` pointed at the deleted
  `ocean-breath-in-yoga` post, so the breathing visualizer linked through a
  redirect; now `pranayama-breathing-techniques`.
- `src/content/posts/brain-fog-meditation.md` — fixed a broken Ghost-import
  link `__GHOST_URL__/mindfulness-for-brain-fog-2/` → `/mindfulness-for-brain-fog/`.
- Stripped 94 `<a>` tags with no `href` (Ghost import artifacts, text kept) in
  `alternate-nostril-breathing.md`, `attention-control-strategies.md`,
  `divided-attention.md`, `introspection-on-attention.md`.

### New tooling

- `scripts/seo-audit.mjs` — parses `dist/_redirects`, resolves every source
  against `dist/` following the redirect map (chain detection), audits the
  sitemap, and crawls all built HTML for internal links and canonical tags
  that point at redirects or 404s.

### Not changed (verified OK)

- `public/robots.txt` — keeps `Disallow: /search`, `/page/*`, `/*?*`,
  `/~partytown`; does not block articles, categories, images, CSS, or JS;
  sitemap declaration already points at
  `https://www.nourishedjourneys.com/sitemap-index.xml`.
- `astro.config.mjs` sitemap filter — already excludes `/404/`, `/search/`,
  `/page/*`, `/tags/*`, category pagination > 1, and query-string URLs.
- Canonical generation in `src/components/BaseHead.astro` — already emits
  `https://www.nourishedjourneys.com` + trailing slash + root-level path.
- Cloudflare adapter config — no interference found; `_redirects`, `ads.txt`,
  `robots.txt`, sitemap files all land in `dist/` and `/_astro/*` + `/ads.txt`
  are excluded from the worker routes.
- `/box-breathing/` (flagged as a 404 anomaly in GSC) builds correctly —
  `dist/box-breathing/index.html` exists and serves 200.

---

## Verification results

### HTTP checks against the built site (`python3 -m http.server` on `dist/`)

| URL | Status |
|---|---|
| /robots.txt | 200 |
| /sitemap-index.xml | 200 |
| /sitemap-0.xml | 200 |
| /ads.txt | 200 |
| / | 200 |
| /about/ | 200 |
| /box-breathing/ | 200 |
| /brain-dump/ | 200 |
| /pranayama-breathing-techniques/ | 200 |
| /tummo-breathing/ | 200 |
| /journaling-for-beginners/ | 200 |
| /mindfulness-vs-meditation/ | 200 |
| /pursed-lip-breathing/ | 200 |
| /brain-fog-meditation/ | 200 |
| /attention-control-strategies/ | 200 |
| /mindfulness-for-brain-fog/ | 200 |
| /category/ | 200 |
| /category/Yoga/1/ | 200 |
| /category/Breathing/1/ | 200 |
| /category/Meditation/1/ | 200 |
| /category/Journaling/1/ | 200 |
| /category/Mental%20Clarity/1/ | 200 |

### Canonical spot-checks (spec section 6)

All six flagged pages emit the correct canonical
(`https://www.nourishedjourneys.com/{slug}/`, HTTPS, www host, trailing slash,
root-level, no redirect):

- `/mindfulness-vs-meditation/`, `/pursed-lip-breathing/`, `/tummo-breathing/`,
  `/journaling-for-beginners/`, `/brain-dump/`, `/pranayama-breathing-techniques/`

### Audit summary (`scripts/seo-audit.mjs`, exit 0)

- Static redirect sources tested: 118 — **0 redirect chains, 0 failing destinations**
- Placeholder rules spot-checked with existing / consolidated / unknown slugs —
  `/post/tummo-breathing/` and `/posts/tummo-breathing/` both 301 directly to
  `/tummo-breathing/` (200); consolidated slugs redirect in exactly 1 hop
- Sitemap: 76 URLs in `sitemap-0.xml` — **0 redirect or fail**; no `/posts/`,
  `/post/`, `/tag/`, `/tags/`, query-string, search, or 404 URLs
- Internal-link crawl: 85 HTML pages — **0 links pointing at redirects or 404s**
- Canonical audit: **0 problems** (the 404 page itself is exempt — not indexable)

The full machine-generated table follows.

---

## Redirect rule audit

| SOURCE URL | STATUS | DESTINATION | HOPS | FINAL STATUS |
|---|---|---|---|---|
| /sitemap.xml | 301 | /sitemap-index.xml | 1 | 200 |
| /post/how-to-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /post/how-to-brain-dump | 301 | /brain-dump/ | 1 | 200 |
| /posts/how-to-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/how-to-brain-dump | 301 | /brain-dump/ | 1 | 200 |
| /post/brain-dump-journaling/ | 301 | /brain-dump/ | 1 | 200 |
| /post/brain-dump-journaling | 301 | /brain-dump/ | 1 | 200 |
| /posts/brain-dump-journaling/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/brain-dump-journaling | 301 | /brain-dump/ | 1 | 200 |
| /post/creative-brain-dump-techniques/ | 301 | /brain-dump/ | 1 | 200 |
| /post/creative-brain-dump-techniques | 301 | /brain-dump/ | 1 | 200 |
| /posts/creative-brain-dump-techniques/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/creative-brain-dump-techniques | 301 | /brain-dump/ | 1 | 200 |
| /post/50-brain-dump-prompts/ | 301 | /brain-dump/ | 1 | 200 |
| /post/50-brain-dump-prompts | 301 | /brain-dump/ | 1 | 200 |
| /posts/50-brain-dump-prompts/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/50-brain-dump-prompts | 301 | /brain-dump/ | 1 | 200 |
| /post/100-brain-dump-prompts/ | 301 | /brain-dump/ | 1 | 200 |
| /post/100-brain-dump-prompts | 301 | /brain-dump/ | 1 | 200 |
| /posts/100-brain-dump-prompts/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/100-brain-dump-prompts | 301 | /brain-dump/ | 1 | 200 |
| /post/adhd-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /post/adhd-brain-dump | 301 | /brain-dump/ | 1 | 200 |
| /posts/adhd-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/adhd-brain-dump | 301 | /brain-dump/ | 1 | 200 |
| /post/bullet-journal-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /post/bullet-journal-brain-dump | 301 | /brain-dump/ | 1 | 200 |
| /posts/bullet-journal-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/bullet-journal-brain-dump | 301 | /brain-dump/ | 1 | 200 |
| /post/creative-brain-dump-techniques-for-writers-artists-unleash-your-imaginatio/ | 301 | /brain-dump/ | 1 | 200 |
| /post/creative-brain-dump-techniques-for-writers-artists-unleash-your-imaginatio | 301 | /brain-dump/ | 1 | 200 |
| /posts/creative-brain-dump-techniques-for-writers-artists-unleash-your-imaginatio/ | 301 | /brain-dump/ | 1 | 200 |
| /posts/creative-brain-dump-techniques-for-writers-artists-unleash-your-imaginatio | 301 | /brain-dump/ | 1 | 200 |
| /post/adhd-brain-fog-emergency/ | 301 | /brain-fog-meditation/ | 1 | 200 |
| /post/adhd-brain-fog-emergency | 301 | /brain-fog-meditation/ | 1 | 200 |
| /posts/adhd-brain-fog-emergency/ | 301 | /brain-fog-meditation/ | 1 | 200 |
| /posts/adhd-brain-fog-emergency | 301 | /brain-fog-meditation/ | 1 | 200 |
| /post/focus-meditation-techniques/ | 301 | /brain-fog-meditation/ | 1 | 200 |
| /post/focus-meditation-techniques | 301 | /brain-fog-meditation/ | 1 | 200 |
| /posts/focus-meditation-techniques/ | 301 | /brain-fog-meditation/ | 1 | 200 |
| /posts/focus-meditation-techniques | 301 | /brain-fog-meditation/ | 1 | 200 |
| /post/mindfulness-attention-training/ | 301 | /attention-control-strategies/ | 1 | 200 |
| /post/mindfulness-attention-training | 301 | /attention-control-strategies/ | 1 | 200 |
| /posts/mindfulness-attention-training/ | 301 | /attention-control-strategies/ | 1 | 200 |
| /posts/mindfulness-attention-training | 301 | /attention-control-strategies/ | 1 | 200 |
| /post/journal-for-anxiety/ | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /post/journal-for-anxiety | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /posts/journal-for-anxiety/ | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /posts/journal-for-anxiety | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /post/mindfulness-for-brain-fog-2/ | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /post/mindfulness-for-brain-fog-2 | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /posts/mindfulness-for-brain-fog-2/ | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /posts/mindfulness-for-brain-fog-2 | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /post/journaling-for-beginners-2/ | 301 | /journaling-for-beginners/ | 1 | 200 |
| /post/journaling-for-beginners-2 | 301 | /journaling-for-beginners/ | 1 | 200 |
| /posts/journaling-for-beginners-2/ | 301 | /journaling-for-beginners/ | 1 | 200 |
| /posts/journaling-for-beginners-2 | 301 | /journaling-for-beginners/ | 1 | 200 |
| /post/ocean-breath-in-yoga/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /post/ocean-breath-in-yoga | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /posts/ocean-breath-in-yoga/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /posts/ocean-breath-in-yoga | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /post/shitali-breath/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /post/shitali-breath | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /posts/shitali-breath/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /posts/shitali-breath | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /post/chandra-bhedana-breathwork/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /post/chandra-bhedana-breathwork | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /posts/chandra-bhedana-breathwork/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /posts/chandra-bhedana-breathwork | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /how-to-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /brain-dump-journaling/ | 301 | /brain-dump/ | 1 | 200 |
| /creative-brain-dump-techniques/ | 301 | /brain-dump/ | 1 | 200 |
| /50-brain-dump-prompts/ | 301 | /brain-dump/ | 1 | 200 |
| /100-brain-dump-prompts/ | 301 | /brain-dump/ | 1 | 200 |
| /adhd-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /bullet-journal-brain-dump/ | 301 | /brain-dump/ | 1 | 200 |
| /creative-brain-dump-techniques-for-writers-artists-unleash-your-imaginatio/ | 301 | /brain-dump/ | 1 | 200 |
| /adhd-brain-fog-emergency/ | 301 | /brain-fog-meditation/ | 1 | 200 |
| /focus-meditation-techniques/ | 301 | /brain-fog-meditation/ | 1 | 200 |
| /mindfulness-attention-training/ | 301 | /attention-control-strategies/ | 1 | 200 |
| /journal-for-anxiety/ | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /mindfulness-for-brain-fog-2/ | 301 | /mindfulness-for-brain-fog/ | 1 | 200 |
| /journaling-for-beginners-2/ | 301 | /journaling-for-beginners/ | 1 | 200 |
| /ocean-breath-in-yoga/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /shitali-breath/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /chandra-bhedana-breathwork/ | 301 | /pranayama-breathing-techniques/ | 1 | 200 |
| /tag/yoga/ | 301 | /category/Yoga/1/ | 1 | 200 |
| /tag/breath/ | 301 | /category/Breathing/1/ | 1 | 200 |
| /tag/mindfulness/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tag/journaling/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tag/Anxiety/1/ | 301 | /category/Mental%20Clarity/1/ | 1 | 200 |
| /tag/Attention/1/ | 301 | /category/Mental%20Clarity/1/ | 1 | 200 |
| /tag/Journaling/1/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tag/Meditation/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tag/Yoga/1/ | 301 | /category/Yoga/1/ | 1 | 200 |
| /tag/Brain%20Fog/1/ | 301 | /category/Mental%20Clarity/1/ | 1 | 200 |
| /tag/Mindfulness/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/ | 301 | /category/ | 1 | 200 |
| /tags/adhd/1/ | 301 | /category/Mental%20Clarity/1/ | 1 | 200 |
| /tags/anxiety/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/apps/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/beginners/1/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tags/brain-fog/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/breathing/1/ | 301 | /category/Breathing/1/ | 1 | 200 |
| /tags/creativity/1/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tags/focus/1/ | 301 | /category/Mental%20Clarity/1/ | 1 | 200 |
| /tags/gratitude/1/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tags/history/1/ | 301 | /category/Yoga/1/ | 1 | 200 |
| /tags/journaling/1/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tags/meditation/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/mindfulness/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/productivity/1/ | 301 | /category/Journaling/1/ | 1 | 200 |
| /tags/self-reflection/1/ | 301 | /category/Mental%20Clarity/1/ | 1 | 200 |
| /tags/sleep/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/stress/1/ | 301 | /category/Meditation/1/ | 1 | 200 |
| /tags/yoga/1/ | 301 | /category/Yoga/1/ | 1 | 200 |
| /author/chester | 301 | /about/ | 1 | 200 |
| /about | 301 | /about/ | 1 | 200 |

## Placeholder rule spot-checks

| SOURCE URL | STATUS | DESTINATION | HOPS | FINAL | FINAL STATUS | NOTE |
|---|---|---|---|---|---|---|
| /post/tummo-breathing/ | 301 | /tummo-breathing/ | 1 | /tummo-breathing/ | 200 | existing slug, trailing slash |
| /post/tummo-breathing | 301 | /tummo-breathing/ | 1 | /tummo-breathing/ | 200 | existing slug, no slash |
| /posts/tummo-breathing/ | 301 | /tummo-breathing/ | 1 | /tummo-breathing/ | 200 | existing slug, trailing slash |
| /posts/tummo-breathing | 301 | /tummo-breathing/ | 1 | /tummo-breathing/ | 200 | existing slug, no slash |
| /post/how-to-brain-dump/ | 301 | /brain-dump/ | 1 | /brain-dump/ | 200 | consolidated slug (chain check) |
| /posts/how-to-brain-dump/ | 301 | /brain-dump/ | 1 | /brain-dump/ | 200 | consolidated slug (chain check) |
| /posts/adhd-brain-fog-emergency/ | 301 | /brain-fog-meditation/ | 1 | /brain-fog-meditation/ | 200 | consolidated slug (GSC chain) |
| /tag/unknown-topic/ | 301 | /category/ | 1 | /category/ | 200 | generic /tag/ fallback |
| /tag/unknown-topic/3/ | 301 | /category/ | 1 | /category/ | 200 | generic /tag/ pagination fallback |
| /tags/unknown-topic/1/ | 301 | /category/ | 1 | /category/ | 200 | generic /tags/ splat fallback |

## Sitemap audit

sitemap-index.xml exists: true
sitemap-0.xml URLs: 76
URLs that redirect or fail: 0
URLs with legacy prefixes/query/404/search: 0

## Internal link crawl

HTML pages checked: 84
Internal links pointing at redirects or 404s: 0

## Canonical audit

Pages with canonical problems: 0

## Summary

- Static redirect sources tested: 118
- Redirect chains (hops > 1): 0
- Sources whose final destination is not 200: 0
- Sitemap URLs failing: 0
- Internal links to redirects/404s: 0
- Canonical problems: 0

---

## Could not be verified locally

- **Actual 301 behavior of `public/_redirects`** — Cloudflare Pages/Workers
  applies `_redirects` at the edge; a local static server does not. The audit
  above emulates the redirect map (static rules before placeholders, file
  order within each class) against `dist/`, but the real 301 responses must be
  confirmed after deploy, e.g.:
  `curl -sI https://www.nourishedjourneys.com/post/tummo-breathing/ | head -2`
- **Cloudflare adapter / worker behavior in production** (`_routes.json`,
  Googlebot requests, Partytown) — verified only as far as the build output.
- **Google Search Console state** — resubmit `sitemap-index.xml` and start
  validation for the redirect and 404 reports after deployment.
- **Visual desktop/mobile rendering** — build succeeds and no CSS/layout code
  changed (only link targets and href-less anchor cleanup), but no browser
  screenshot pass was run locally.
