import { defineCollection, z } from "astro:content";
import { sonicjsLoader } from "../lib/sonicjs-loader";

const posts = defineCollection({
  loader: sonicjsLoader(),
  schema: z.object({
    title: z.string(),
    pubDate: z.date(),
    description: z.string(),
    lastModified: z.string().optional(),
    cover: z.string(),
    coverAlt: z.string(),
    category: z.array(z.string()),
    tags: z.array(z.string()),
    author: z.string(),
    slug: z.string(),
    content: z.string().optional(),
  }),
});

export const collections = { posts };
