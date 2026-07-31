#!/usr/bin/env node
/**
 * Auto-assign tags + category to every post in src/content/posts/*.md
 * based on slug keyword matching against a fixed wellness taxonomy.
 *
 * Run: node scripts/auto-tag-posts.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = path.join(__dirname, "..", "src", "content", "posts");

// --- Tag rules: keyword in slug -> tag (order doesn't matter, all matches apply) ---
const TAG_RULES = [
  [["breathing", "breath", "pranayama", "nadi", "ujjayi", "shitali", "tummo",
    "kapalabhati", "buteyko", "physiological-sigh", "pursed-lip", "chandra-bhedana",
    "ocean-breath", "yoga-breathing", "belly-breathing", "alternate-nostril",
    "coherent-breathing", "wim-hof"], "breathing"],
  [["meditate", "meditation"], "meditation"],
  [["mindful"], "mindfulness"],
  [["journal", "brain-dump", "morning-pages", "prompts"], "journaling"],
  [["yoga", "sukhasana", "halasana"], "yoga"],
  [["brain-fog", "mental-clarity", "mental-cloudiness"], "brain-fog"],
  [["attention", "focus", "selective", "divided", "mind-wandering"], "focus"],
  [["insomnia", "sleep"], "sleep"],
  [["anxiety", "stress", "calm", "emergency", "reset"], "anxiety"],
  [["beginners", "how-to", "how-long", "why-start", "start-a", "starting-a"], "beginners"],
  [["gratitude"], "gratitude"],
  [["creativity", "creative", "dream", "travel"], "creativity"],
  [["productivity"], "productivity"],
  [["self-reflection", "introspection", "reflection"], "self-reflection"],
  [["adhd"], "adhd"],
  [["apps"], "apps"],
  [["cold", "mindset"], "mindset"],
  [["history"], "history"],
];

// --- Category rules: first match wins (priority order) ---
const CATEGORY_RULES = [
  [["sukhasana", "halasana", "yogas-history"], "Yoga"],
  [["breathing", "breath", "pranayama", "nadi", "ujjayi", "shitali", "tummo",
    "kapalabhati", "buteyko", "physiological-sigh", "pursed-lip", "chandra-bhedana",
    "ocean-breath", "yoga-breathing", "belly-breathing", "alternate-nostril",
    "coherent-breathing", "wim-hof"], "Breathing"],
  [["journal", "brain-dump", "morning-pages", "prompts"], "Journaling"],
  [["meditate", "meditation", "mindful"], "Meditation"],
  [["brain-fog", "mental-clarity", "attention", "focus", "selective", "divided",
    "mind-wandering", "adhd"], "Mental Clarity"],
];

function matchRules(slug, rules) {
  const matches = new Set();
  for (const [keywords, label] of rules) {
    if (keywords.some((kw) => slug.includes(kw))) matches.add(label);
  }
  return [...matches];
}

function matchFirstRule(slug, rules) {
  for (const [keywords, label] of rules) {
    if (keywords.some((kw) => slug.includes(kw))) return label;
  }
  return "Wellness";
}

const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
let changed = 0;
const report = [];

for (const file of files) {
  const filePath = path.join(POSTS_DIR, file);
  const slug = file.replace(/\.md$/, "");
  let content = fs.readFileSync(filePath, "utf-8");

  const tags = matchRules(slug, TAG_RULES);
  const category = [matchFirstRule(slug, CATEGORY_RULES)];

  if (tags.length === 0) {
    report.push(`${slug}: NO TAGS MATCHED — review manually`);
    continue;
  }

  // Replace tags: [...] and category: [...] in frontmatter
  const tagsLine = `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`;
  const catLine = `category: [${category.map((c) => `"${c}"`).join(", ")}]`;

  const newContent = content
    .replace(/^tags:\s*\[.*\]$/m, tagsLine)
    .replace(/^category:\s*\[.*\]$/m, catLine);

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, "utf-8");
    changed++;
    report.push(`${slug}: tags=[${tags.join(", ")}] category=[${category[0]}]`);
  } else {
    report.push(`${slug}: NO CHANGE (frontmatter pattern not matched)`);
  }
}

console.log(`\nProcessed ${files.length} posts, changed ${changed}.\n`);
console.log(report.join("\n"));
