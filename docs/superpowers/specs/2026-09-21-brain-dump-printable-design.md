# Brain Dump "Mind Dump Cycle" Printable — Design

Date: 2026-09-21
Status: Approved (user confirmed design in conversation)

## Goal

Reuse the Napkin AI "Mind Dump Cycle" infographic (`How to Do a Brain Dump - visual selection(1).svg`, 768×558) as:

1. An inline visual in two blog posts (`/brain-dump/`, `/brain-dump-vs-morning-pages/`), each with a "Download printable PDF" button.
2. A downloadable entry in the `/resources/` PDF library.
3. The same PDF doubles as the Etsy printable listing asset (build once, use twice).

## Decisions (confirmed with user)

- Blog posts: embed the SVG inline as a `<figure>` with caption + a styled "Download the printable PDF" button below it.
- PDF: single page, US Letter landscape.

## Assets (build once)

- Copy the SVG to `public/brain-dump-mind-dump-cycle.svg` (site images live at the `public/` root).
- Convert SVG → PDF with headless Google Chrome (`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless --print-to-pdf`), Letter landscape, so the embedded web fonts (Roboto, STIX Two Text via `@font-face` from fonts.napkin.ai) load and render exactly as designed. If fonts fail to load in headless mode, fall back to downloading the TTFs and registering them with fontconfig for the conversion.
- Output: `public/pdfs/How_to_Do_a_Brain_Dump_Cycle.pdf` (snake_case, matching existing library naming).

## Page changes (use twice)

### `src/content/posts/brain-dump.md`

After the "How to Brain Dump" intro paragraph (before the numbered steps), insert:

```html
<figure>
  <img src="/brain-dump-mind-dump-cycle.svg" alt="The Mind Dump Cycle: set a timer, pick a place, write without editing, keep going, stop when the timer ends, sort into piles." loading="lazy" />
  <figcaption>The six-step brain dump process at a glance.</figcaption>
</figure>
<p><a href="/pdfs/How_to_Do_a_Brain_Dump_Cycle.pdf" download>Download the printable PDF</a></p>
```

(Button styling matches the markdown/HTML idiom already used in the posts.)

### `src/content/posts/brain-dump-vs-morning-pages.md`

Same figure + download button, placed near the brain dump section of that article.

### `src/pages/resources.astro`

Add one entry to the `pdfs` array:

- title: "The Mind Dump Cycle"
- file: `/pdfs/How_to_Do_a_Brain_Dump_Cycle.pdf`
- description: printable one-page visual of the six-step brain dump process.

Existing markup renders the Download button automatically.

## Verification

- `pnpm build` passes.
- Generated PDF opens as one Letter-landscape page with correct fonts (visually inspected).
- SVG and PDF return 200 from the built `dist/` output; all three pages reference them.
