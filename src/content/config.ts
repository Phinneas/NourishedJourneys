import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    description: z.string(),
    lastModified: z.string().optional(),
    cover: z.string(),
    coverAlt: z.string(),
    category: z.array(z.string()),
    tags: z.array(z.string()),
    author: z.string(),
    slug: z.string(),
  }),
});

const techniques = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.string(),
    name: z.string(),
    tagline: z.string(),
    goal: z.enum(["calm", "focus", "sleep", "energy", "reset", "foundation"]),
    pattern: z.object({
      inhale: z.number(),
      holdIn: z.number(),
      exhale: z.number(),
      holdOut: z.number(),
    }),
    rounds: z.number().nullable(),
    shortDescription: z.string(),
    blogSlug: z.string().nullable(),
    accentColor: z.string(),
  }),
});

export const collections = { posts, techniques };
