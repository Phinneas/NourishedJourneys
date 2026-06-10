# Breathing Visualizer — Design Spec
**Date:** 2026-06-08
**Project:** Nourished Journeys (`/Users/chesterbeard/Desktop/nourishedjourneys`)
**Status:** Approved, pending implementation plan

---

## Overview

An interactive breathing visualizer with 12 guided techniques, integrated into the Nourished Journeys site. Each technique gets its own practice page cross-linked to its blog post. A hub page serves as the central destination with goal-based filtering.

Competitive reference: deepbreathingexercises.com/breathing-visualizer — we match their feature set and exceed it in visual design, goal filtering, session control, and blog integration.

---

## URL Structure

| URL | Purpose |
|---|---|
| `/breathing-visualizer` | Hub — browse and filter all techniques |
| `/breathing-visualizer/[slug]` | Practice page — visualizer + controls for one technique |
| `/box-breathing` | 301 redirect → `/breathing-visualizer/box-breathing` |

---

## File Structure

```
src/content/techniques/          ← content collection, one JSON per technique
  box-breathing.json
  4-7-8.json
  coherent-breathing.json
  physiological-sigh.json
  wim-hof.json
  pursed-lip.json
  nadi-shodhana.json
  ujjayi.json
  belly-breathing.json
  buteyko.json
  tummo.json
  breath-of-fire.json

src/pages/breathing-visualizer/
  index.astro                    ← hub page
  [slug].astro                   ← dynamic practice page

src/components/
  BreathingVisualizer.astro      ← SVG visualizer + JS state machine
  TechniqueCard.astro            ← card for hub grid
```

**No new npm dependencies.** All interactivity runs in vanilla JS inside `<script>` tags.

---

## Technique Data Schema

Each JSON file in `src/content/techniques/` follows this shape:

```json
{
  "slug": "box-breathing",
  "name": "Box Breathing",
  "tagline": "Equal-ratio breathing for focus and calm",
  "goal": "focus",
  "pattern": {
    "inhale": 4,
    "holdIn": 4,
    "exhale": 4,
    "holdOut": 4
  },
  "rounds": null,
  "shortDescription": "Four equal phases of 4 seconds each. The simplest entry point for regulated breathing.",
  "blogSlug": "box-breathing",
  "accentColor": "#5B8FA8"
}
```

**Goal values** (one per technique): `calm` | `focus` | `sleep` | `energy` | `reset` | `foundation`

**rounds** is only set for Wim Hof (30 breaths × 3 rounds); null for all others.

---

## The 12 Techniques

| Slug | Name | Pattern | Goal |
|---|---|---|---|
| `box-breathing` | Box Breathing | 4-4-4-4 | focus |
| `4-7-8` | 4-7-8 Breathing | 4-7-8-0 | sleep |
| `coherent-breathing` | Coherent Breathing | 5.5-0-5.5-0 | calm |
| `physiological-sigh` | Physiological Sigh | 2.5-1.5-0-6-1 | reset |
| `wim-hof` | Wim Hof Breathing | 1.5-0-1.5-0 (30×3) | energy |
| `pursed-lip` | Pursed Lip Breathing | 2-0-4-0 | foundation |
| `nadi-shodhana` | Nadi Shodhana | 4-4-4-0 | calm |
| `ujjayi` | Ujjayi Breathing | 4-0-6-0 | focus |
| `belly-breathing` | Belly Breathing | 4-0-6-0 | foundation |
| `buteyko` | Buteyko Breathing | 3-0-3-3 | calm |
| `tummo` | Tummo Breathing | 2-0-1-0 | energy |
| `breath-of-fire` | Breath of Fire | 0.75-0-0.75-0 | energy |

---

## Visualizer Component (`BreathingVisualizer.astro`)

### Shape
An SVG morphing irregular circle. Two hand-crafted SVG `<path>` definitions — both roughly circular but with subtly varied cubic bezier control points — that interpolate between each other using CSS `d` property animation. The result looks like a circle that is gently, organically breathing rather than mechanically scaling.

- **Inhale state:** expanded irregular circle (larger radius, slightly different point distribution)
- **Exhale state:** contracted irregular circle (smaller, different subtle deformations)
- **Hold states:** shape pauses at its current position; a subtle slow pulse (opacity/scale micro-animation) signals the hold

The phase label ("Breathe in" / "Hold" / "Breathe out") floats centered inside the shape. A thin arc ring around the outside counts down remaining seconds in the current phase.

### JS State Machine

Phases cycle in order, each lasting the technique's specified seconds × the user's speed multiplier:

```
inhale → holdIn → exhale → holdOut → (repeat)
```

For techniques with `holdIn: 0` or `holdOut: 0`, those phases are skipped transparently.

For Wim Hof, a round counter is shown ("Round 2 of 3"). After all rounds complete, the session ends.

### Audio (Web Audio API)
- Phase start: brief sine tone (different pitch per phase)
- Off by default, toggleable
- No external audio files — generated in-browser

### Haptics (Vibration API)
- Short vibration pulse on each phase transition
- Off by default, toggleable
- Gracefully ignored on devices that don't support it

---

## Hub Page (`/breathing-visualizer`)

**Content sections:**
1. H1 + one-paragraph intro (what a breathing visualizer does, why use one)
2. Goal filter bar: `All` · `Calm` · `Focus` · `Sleep` · `Energy` · `Reset` · `Foundation`
   - Client-side filter, no page reload, driven by `data-goal` attributes on cards
3. Technique grid (3 cols desktop / 2 tablet / 1 mobile)
4. Brief FAQ section (mirrors competitor SEO pattern)

**TechniqueCard shows:**
- Technique name
- Timing pattern (e.g. "4 · 4 · 4 · 4")
- Goal badge (coloured pill)
- One-line benefit
- "Practice" button → `/breathing-visualizer/[slug]`
- "Read the guide →" link → `/[blogSlug]` (only rendered if blogSlug exists)

---

## Practice Page (`/breathing-visualizer/[slug]`)

**Layout (top to bottom):**
1. Technique name + tagline
2. Morphing irregular circle visualizer (dominant, centred)
3. Timing reference strip: inhale / hold / exhale / hold in labelled seconds
4. Controls:
   - Start / Pause button
   - Speed slider: 0.75× · 1× · 1.25× · 1.5×
   - Session length: 1 min · 3 min · 5 min · 10 min
   - Audio toggle
   - Haptic toggle
5. "Want to go deeper?" → links to blog post (only if `blogSlug` set)
6. "Try another technique" → `/breathing-visualizer`

**SEO:** Page title = "[Technique Name] Breathing Visualizer — Nourished Journeys". Meta description drawn from `shortDescription`. Canonical set. No duplicate content with blog post (different intent: practice vs. learn).

---

## Redirect

In `astro.config.mjs`, add to the `redirects` object:

```js
'/box-breathing': '/breathing-visualizer/box-breathing'
```

---

## What Beats the Competitor

| Feature | deepbreathingexercises.com | Nourished Journeys |
|---|---|---|
| Visualizer shape | Perfect circle scale | Morphing irregular circle |
| Goal filtering | None | Calm / Focus / Sleep / Energy / Reset |
| Session length | Not specified | 1 / 3 / 5 / 10 min |
| Blog integration | None | Every technique cross-links to guide |
| Brand warmth | Clinical, generic | NJ tone and palette |
| Techniques | 12 | 12 at launch, add via JSON |
| Architecture | Single page | Hub + individual SEO pages |

---

## Out of Scope (this phase)
- Session history / streak tracking (localStorage) — defer to v2
- Custom timing editor (create your own pattern) — defer to v2
- Multiple visualizer shape styles (blob, box, flower) — defer to v2
