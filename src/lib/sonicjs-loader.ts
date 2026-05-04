import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

const SONICJS_API_URL = process.env.SONICJS_API_URL || 'https://sonicjscms.buzzuw2.workers.dev/api';
const COLLECTION_ID = '2c306af6-4dab-47c7-8973-f393c7363c99';

export const sonicjsLoader = () => {
  return {
    name: 'sonicjs-loader',
    load: async ({ store, parseData }) => {
      const response = await fetch(`${SONICJS_API_URL}/content?collectionId=${COLLECTION_ID}&status=published&limit=200`);
      const data = await response.json();

      const posts = (data.data || []);

      store.clear();

      for (const post of posts) {
        const id = post.id || post.key;
        const postData = post.data;

        // Parse tags string into array
        const tags = postData.tags
          ? postData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];

        // Clean up image URL - remove Ghost internal URLs
        let cover = postData.featuredImage || '';
        if (cover && (cover.includes('__GHOST_URL__') || cover.startsWith('/'))) {
          cover = ''; // Set to empty to use placeholder
        }

        const transformedData = {
          title: postData.title,
          pubDate: new Date(postData.publishedAt || postData.createdAt),
          description: postData.excerpt || postData.title,
          lastModified: postData.updatedAt,
          cover: cover,
          coverAlt: postData.title,
          category: tags.slice(0, 1),
          tags: tags,
          author: postData.author || 'Chester Beard',
          slug: postData.slug,
          content: postData.content,
        };

        const data = await parseData({
          id,
          data: transformedData,
        });

        store.set({ id, data });
      }
    },
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
  } satisfies Loader;
};
