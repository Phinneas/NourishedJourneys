import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';

const SONICJS_API_URL = process.env.SONICJS_API_URL || 'https://sonicjscms.buzzuw2.workers.dev/api';
const COLLECTION_ID = '2c306af6-4dab-47c7-8973-f393c7363c99';

export const sonicjsLoader = () => {
  return {
    name: 'sonicjs-loader',
    load: async ({ store, parseData }) => {
      console.log('Loading content from SonicJS API...');

      // The SonicJS API does not filter by collectionId server-side,
      // so we fetch all published content and filter client-side.
      // limit=200 causes an API error, so we paginate with limit=100.
      let allItems: any[] = [];
      let offset = 0;
      const pageSize = 100;

      while (true) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(
            `${SONICJS_API_URL}/content?status=published&limit=${pageSize}&offset=${offset}`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (!response.ok) {
            console.warn(`SonicJS API returned status ${response.status} for offset ${offset}`);
            break;
          }

          const data = await response.json();
          const items = data.data || [];
          console.log(`Fetched ${items.length} items at offset ${offset}`);

          if (items.length === 0) break;
          allItems = allItems.concat(items);
          if (items.length < pageSize) break;
          offset += pageSize;
        } catch (error) {
          console.error(`Error fetching content at offset ${offset}:`, error);
          break;
        }
      }

      // Filter to only posts belonging to the nourishedjourneys collection
      const posts = allItems.filter(
        (post: any) => post.collectionId === COLLECTION_ID
      );

      console.log(`Found ${posts.length} posts after filtering for collection ${COLLECTION_ID}`);

      store.clear();

      for (const post of posts) {
        const id = post.id || post.key;
        const postData = post.data;

        // Parse tags string into array
        const tags = postData.tags
          ? postData.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [];

        // API returns normalized field names (featuredImage, publishedAt)
        // regardless of the CMS schema's original field names
        const cover = postData.featuredImage || postData.featuredimage || '';
        const pubDate = postData.publishedAt || postData.publshedat || post.created_at || new Date().toISOString();
        const excerpt = postData.excerpt || postData.title;

        // Clean up image URL - remove Ghost internal URLs
        const cleanCover = cover && (cover.includes('__GHOST_URL__') || cover.startsWith('/')) ? '' : cover;

        const transformedData = {
          title: postData.title,
          pubDate: new Date(pubDate),
          description: excerpt,
          lastModified: postData.updatedAt ? String(postData.updatedAt) : post.updated_at ? String(post.updated_at) : undefined,
          cover: cleanCover,
          coverAlt: postData.title,
          category: tags.slice(0, 1),
          tags: tags,
          author: postData.author || 'Chester Beard',
          slug: postData.slug || post.slug,
          content: postData.content,
        };

        const parsedData = await parseData({
          id,
          data: transformedData,
        });

        store.set({ id, data: parsedData });
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
