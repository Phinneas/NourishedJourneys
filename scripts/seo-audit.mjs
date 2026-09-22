#!/usr/bin/env node
/**
 * SEO redirect / sitemap / canonical / internal-link audit for the built site.
 *
 * Usage: pnpm build && node scripts/seo-audit.mjs
 *
 * Parses dist/_redirects, resolves every source against dist/ (following the
 * redirect map itself to detect chains), verifies every sitemap URL returns
 * 200, and crawls all built HTML for internal links and canonical tags that
 * point at redirects or 404s. Prints a markdown report to stdout.
 */
import fs from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const REDIRECTS_FILE = path.join(DIST, "_redirects");

// ---------- redirect map ----------
function parseRedirects(file) {
  const rules = [];
  for (const rawLine of fs.readFileSync(file, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) continue;
    rules.push({ source: parts[0], dest: parts[1], status: parts[2] || "301" });
  }
  return rules;
}

function matchRule(rule, urlPath) {
  const src = rule.source;
  if (!src.includes(":") && !src.includes("*")) {
    return src === urlPath ? rule.dest : null;
  }
  // Placeholder: single path segment. Splat: rest of path.
  const srcSegs = src.split("/");
  const dstSegs = urlPath.split("/");
  if (src.includes("*")) {
    const idx = srcSegs.indexOf("*");
    if (dstSegs.length - 1 < idx) return null;
    for (let i = 0; i < idx; i++) if (srcSegs[i] !== dstSegs[i]) return null;
    const rest = dstSegs.slice(idx).join("/");
    return rule.dest.replace(":splat", rest).replace("*", rest);
  }
  if (srcSegs.length !== dstSegs.length) return null;
  const params = {};
  for (let i = 0; i < srcSegs.length; i++) {
    const s = srcSegs[i];
    if (s.startsWith(":")) {
      if (dstSegs[i] === "") return null;
      params[s.slice(1)] = dstSegs[i];
    } else if (s !== dstSegs[i]) {
      return null;
    }
  }
  return rule.dest.replace(/:([A-Za-z]+)/g, (_, k) => params[k] ?? "");
}

const rules = parseRedirects(REDIRECTS_FILE);
const staticRules = rules.filter((r) => !r.source.includes(":") && !r.source.includes("*"));
const dynamicRules = rules.filter((r) => r.source.includes(":") || r.source.includes("*"));

function applyOnce(urlPath) {
  // Cloudflare Pages semantics: static matches take precedence over
  // placeholder/splat rules; within each class, file order wins.
  for (const r of staticRules) {
    const d = matchRule(r, urlPath);
    if (d) return { dest: d, status: r.status };
  }
  for (const r of dynamicRules) {
    const d = matchRule(r, urlPath);
    if (d) return { dest: d, status: r.status };
  }
  return null;
}

// ---------- dist filesystem resolution ----------
function distStatus(urlPath) {
  const p = decodeURIComponent(urlPath.split("?")[0]).split("#")[0];
  const full = path.join(DIST, p);
  try {
    const st = fs.statSync(full);
    if (st.isFile()) return 200;
    if (st.isDirectory() && fs.existsSync(path.join(full, "index.html"))) return 200;
  } catch {}
  if (fs.existsSync(full + ".html")) return 200; // e.g. /404
  if (fs.existsSync(path.join(full, "index.html"))) return 200;
  return 404;
}

function resolve(urlPath) {
  const hops = [];
  let current = urlPath;
  for (let i = 0; i < 6; i++) {
    const m = applyOnce(current);
    if (!m) break;
    hops.push({ from: current, to: m.dest, status: m.status });
    current = m.dest.split("?")[0];
  }
  const finalStatus = distStatus(current);
  return { hops, final: current, finalStatus };
}

// ---------- report helpers ----------
const rows = [];
function row(source, status, dest, hops, finalStatus) {
  rows.push({ source, status, dest, hops, finalStatus });
}

// 1. Every static redirect source
for (const r of staticRules) {
  const { hops, final, finalStatus } = resolve(r.source);
  row(r.source, hops.length ? hops[0].status : "-", hops.length ? hops[0].to : "-", hops.length, finalStatus);
}

// 2. Placeholder rules with sample slugs (existing, consolidated, unknown)
const samples = [
  ["/post/tummo-breathing/", "existing slug, trailing slash"],
  ["/post/tummo-breathing", "existing slug, no slash"],
  ["/posts/tummo-breathing/", "existing slug, trailing slash"],
  ["/posts/tummo-breathing", "existing slug, no slash"],
  ["/post/how-to-brain-dump/", "consolidated slug (chain check)"],
  ["/posts/how-to-brain-dump/", "consolidated slug (chain check)"],
  ["/posts/adhd-brain-fog-emergency/", "consolidated slug (GSC chain)"],
  ["/tag/unknown-topic/", "generic /tag/ fallback"],
  ["/tag/unknown-topic/3/", "generic /tag/ pagination fallback"],
  ["/tags/unknown-topic/1/", "generic /tags/ splat fallback"],
];
const sampleRows = [];
for (const [u, note] of samples) {
  const { hops, final, finalStatus } = resolve(u);
  sampleRows.push({ source: u, status: hops.length ? hops[0].status : "-", dest: hops.length ? hops[0].to : "-", hops: hops.length, final, finalStatus, note });
}

// 3. Sitemap URLs
const sitemapXml = fs.readFileSync(path.join(DIST, "sitemap-0.xml"), "utf8");
const sitemapUrls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const sitemapRows = sitemapUrls.map((u) => {
  const { hops, finalStatus } = resolve(u);
  return { url: u, redirects: hops.length, finalStatus };
});

// 4. Crawl built HTML: internal links + canonicals
function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}
const badLinks = new Map(); // href -> Set<page>
const badCanonicals = [];
let pagesChecked = 0;
for (const file of walk(DIST)) {
  if (file.includes(`${path.sep}pagefind${path.sep}`)) continue;
  if (path.basename(file) === "404.html") continue; // error page: not indexable, exempt from canonical checks
  pagesChecked++;
  const html = fs.readFileSync(file, "utf8");
  const pagePath = "/" + path.relative(DIST, file).replace(/index\.html$/, "").replace(/\.html$/, "");
  for (const m of html.matchAll(/href="([^"#]+)"/g)) {
    const href = m[1];
    if (!href.startsWith("/")) continue;
    const clean = href.split("?")[0];
    const { hops, finalStatus } = resolve(clean);
    if (hops.length > 0 || finalStatus !== 200) {
      if (!badLinks.has(href)) badLinks.set(href, new Set());
      badLinks.get(href).add(pagePath + (hops.length ? " (redirect)" : " (404)"));
    }
  }
  const canon = html.match(/<link rel="canonical" href="([^"]+)"/);
  if (canon) {
    const c = canon[1];
    const u = new URL(c);
    const { hops, finalStatus } = resolve(u.pathname);
    const problems = [];
    if (u.protocol !== "https:") problems.push("not https");
    if (u.hostname !== "www.nourishedjourneys.com") problems.push("wrong host");
    if (u.pathname !== "/" && !u.pathname.endsWith("/")) problems.push("no trailing slash");
    if (hops.length) problems.push("points at redirect");
    if (finalStatus !== 200) problems.push("target not 200");
    if (/^\/(posts?|tags?)\//.test(u.pathname)) problems.push("legacy prefix");
    if (problems.length) badCanonicals.push({ page: pagePath, canonical: c, problems: problems.join(", ") });
  }
}

// ---------- print ----------
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
console.log("## Redirect rule audit\n");
console.log("| SOURCE URL | STATUS | DESTINATION | HOPS | FINAL STATUS |");
console.log("|---|---|---|---|---|");
for (const r of rows) {
  console.log(`| ${r.source} | ${r.status} | ${r.dest} | ${r.hops} | ${r.finalStatus} |`);
}
console.log("\n## Placeholder rule spot-checks\n");
console.log("| SOURCE URL | STATUS | DESTINATION | HOPS | FINAL | FINAL STATUS | NOTE |");
console.log("|---|---|---|---|---|---|---|");
for (const r of sampleRows) {
  console.log(`| ${r.source} | ${r.status} | ${r.dest} | ${r.hops} | ${r.final} | ${r.finalStatus} | ${r.note} |`);
}

console.log("\n## Sitemap audit\n");
console.log(`sitemap-index.xml exists: ${fs.existsSync(path.join(DIST, "sitemap-index.xml"))}`);
console.log(`sitemap-0.xml URLs: ${sitemapUrls.length}`);
const badSitemap = sitemapRows.filter((r) => r.redirects > 0 || r.finalStatus !== 200);
console.log(`URLs that redirect or fail: ${badSitemap.length}`);
for (const r of badSitemap) console.log(`- ${r.url} (redirects: ${r.redirects}, status: ${r.finalStatus})`);
const legacy = sitemapUrls.filter((u) => /^\/(posts?|tags?)\//.test(u) || u.includes("?") || u === "/404/" || u === "/search/");
console.log(`URLs with legacy prefixes/query/404/search: ${legacy.length}`);
for (const u of legacy) console.log(`- ${u}`);

console.log("\n## Internal link crawl\n");
console.log(`HTML pages checked: ${pagesChecked}`);
console.log(`Internal links pointing at redirects or 404s: ${badLinks.size}`);
for (const [href, pages] of badLinks) {
  console.log(`- ${href} <- ${[...pages].slice(0, 5).join(", ")}`);
}

console.log("\n## Canonical audit\n");
console.log(`Pages with canonical problems: ${badCanonicals.length}`);
for (const c of badCanonicals) console.log(`- ${c.page}: ${c.canonical} (${c.problems})`);

// summary
const chains = rows.filter((r) => r.hops > 1).length + sampleRows.filter((r) => r.hops > 1).length;
const failing = rows.filter((r) => r.finalStatus !== 200).length + sampleRows.filter((r) => r.finalStatus !== 200).length;
console.log("\n## Summary\n");
console.log(`- Static redirect sources tested: ${rows.length}`);
console.log(`- Redirect chains (hops > 1): ${chains}`);
console.log(`- Sources whose final destination is not 200: ${failing}`);
console.log(`- Sitemap URLs failing: ${badSitemap.length}`);
console.log(`- Internal links to redirects/404s: ${badLinks.size}`);
console.log(`- Canonical problems: ${badCanonicals.length}`);
process.exit(chains + failing + badSitemap.length + badLinks.size + badCanonicals.length ? 1 : 0);
