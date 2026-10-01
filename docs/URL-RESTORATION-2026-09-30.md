# High-Value URL Restoration — 2026-09-30

## Why
GSC (Feb–Apr 2026 vs Jul–Sep 2026) shows impressions fell 70% (18,183 → 5,513) and
average position moved from 18.5 to 49.3. About 11,400 of the lost impressions came
from posts that were consolidated or dropped during the SonicJS → local-Markdown
migration. URL Inspection shows Google last crawled several of them in late May and
saw **404**, before the consolidation redirects were added.

## Restored as live pages (200)
Content recovered verbatim from the SonicJS `nourishedjourneys` collection
(`/api/collections/nourishedjourneys/content`); `ocean-breath-in-yoga` restored from
git (`b4b8732^`). Only frontmatter descriptions were rewritten and a "Related Reading"
block was added.

| URL | Feb–Apr impressions | Avg. pos. | Previous redirect target |
|---|---|---|---|
| /mindfulness-attention-training/ | 2,813 | 8.8 | /attention-control-strategies/ |
| /adhd-brain-dump/ | 2,583 | 8.0 | /brain-dump/ |
| /focus-meditation-techniques/ | 2,314 | 17.3 | /brain-fog-meditation/ (not indexed) |
| /100-brain-dump-prompts/ | 481 | 7.9 | /brain-dump/ |
| /ocean-breath-in-yoga/ | 421 | 18.1 | /pranayama-breathing-techniques/ |
| /bullet-journal-brain-dump/ | 386 | 12.4 | /brain-dump/ |
| /creative-brain-dump-techniques-for-writers-artists-unleash-your-imaginatio/ | 321 | 10.3 | /brain-dump/ |
| /journal-for-anxiety/ | 90 | 12.7 | /mindfulness-for-brain-fog/ (not indexed) |

## Deliberately left as redirects
- `/how-to-brain-dump/` → `/brain-dump/` (the hub replaced it; restoring it would compete with the hub)
- `/50-brain-dump-prompts/` → **now** `/100-brain-dump-prompts/` (no source copy exists; closest intent)
- `/mindfulness-for-brain-fog-2/`, `/journaling-for-beginners-2/`, `/brain-dump-journaling/`,
  `/adhd-brain-fog-emergency/`, `/shitali-breath/`, `/chandra-bhedana-breathwork/` (duplicates or low value)

## Other changes
- `public/_redirects`: removed 40 rules for restored slugs (root + `/post(s)/` variants;
  the generic `/posts/:slug` rule now covers them).
- `techniques/ujjayi.json` `blogSlug` → `ocean-breath-in-yoga`.
- Inbound links added from hubs: brain-dump, pranayama-breathing-techniques,
  attention-control-strategies, brain-fog-meditation, mindfulness-journaling.
- `public/sitemap-recovery.xml`: **temporary** sitemap (26 URLs: 8 restored + 18 legacy
  redirecting URLs) so Google recrawls them. Not referenced in robots.txt.

## After deploy
1. Submit `https://www.nourishedjourneys.com/sitemap-recovery.xml` in GSC.
2. Request indexing for the 3 largest pages via URL Inspection in the GSC UI.
3. Remove `sitemap-recovery.xml` (and unsubmit it) once the legacy URLs show a
   post-deploy crawl date — roughly 4–8 weeks.

## Verification
`pnpm build` passes; `node scripts/seo-audit.mjs` exit 0 — 0 redirect chains,
0 failing destinations, 84 sitemap URLs all 200, 0 internal links to redirects/404s,
0 canonical problems.
