#!/usr/bin/env tsx
/**
 * Import NourishedJourneys Ghost posts into the SonicJS nourishedjourneys collection
 * 
 * Target collection: 2c306af6-4dab-47c7-8973-f393c7363c99
 * Schema field names: featuredimage, publshedat (typo in CMS), excerpt, author, tags, slug, content
 */

import fs from 'fs';

const GHOST_EXPORT_PATH = '/Users/chesterbeard/Library/Caches/com.apple.SwiftUI.Drag-5B1D7228-9C73-4EBF-A504-6E6060ED50E5/nourished-journeys.ghost.2026-04-22-23-05-23.json';
const SONICJS_API_URL = 'https://sonicjscms.buzzuw2.workers.dev';
const COLLECTION_ID = '2c306af6-4dab-47c7-8973-f393c7363c99';

const ADMIN_EMAIL = 'admin@sonicjs.com';
const ADMIN_PASSWORD = 'sonicjs!';

async function loginAndGetToken(): Promise<string> {
  const response = await fetch(`${SONICJS_API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Login failed (${response.status}): ${errorData.error || 'Invalid credentials'}`);
  }

  const data = await response.json();
  console.log(`Logged in as: ${data.user.email}`);
  return data.token;
}

async function importPosts() {
  console.log('NourishedJourneys Ghost -> SonicJS Import\n');

  const ghostExport = JSON.parse(fs.readFileSync(GHOST_EXPORT_PATH, 'utf-8'));
  const db = ghostExport.db?.[0]?.data;
  if (!db) { console.error('Invalid Ghost export'); process.exit(1); }

  const posts = db.posts || [];
  const tags = db.tags || [];
  const postsTags = db.posts_tags || [];
  const users = db.users || [];

  const tagMap = new Map(tags.map((t: any) => [t.id, t.name]));
  const userMap = new Map(users.map((u: any) => [u.id, u.name]));

  // Build post-tag mapping
  const postTagMap = new Map<string, string[]>();
  for (const pt of postsTags) {
    const list = postTagMap.get(pt.post_id) || [];
    if (tagMap.has(pt.tag_id)) list.push(tagMap.get(pt.tag_id)!);
    postTagMap.set(pt.post_id, list);
  }

  // Filter to published non-page posts
  const published = posts.filter((p: any) => p.status === 'published' && p.type !== 'page');
  console.log(`Found ${published.length} published posts to import\n`);

  const token = await loginAndGetToken();

  let success = 0, fail = 0;

  for (let i = 0; i < published.length; i++) {
    const post = published[i];
    const postTags = postTagMap.get(post.id) || [];
    const author = userMap.get(post.author_id) || 'Chester Beard';
    const excerpt = post.custom_excerpt || (post.plaintext?.slice(0, 200) || post.title);
    const featureImage = post.feature_image || '';

    // Field names match the nourishedjourneys CMS collection schema exactly
    const payload = {
      collectionId: COLLECTION_ID,
      title: post.title,
      slug: post.slug,
      status: 'published',
      data: {
        title: post.title,
        slug: post.slug,
        content: post.html,
        excerpt: excerpt,
        featuredimage: featureImage,
        author: author,
        publshedat: post.published_at,
        tags: postTags.join(', '),
        status: 'published',
      },
    };

    try {
      process.stdout.write(`  [${i + 1}/${published.length}] ${post.slug}... `);
      const response = await fetch(`${SONICJS_API_URL}/api/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Re-auth
          const newToken = await loginAndGetToken();
          const retry = await fetch(`${SONICJS_API_URL}/api/content`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (retry.ok) { console.log('OK (retry)'); success++; continue; }
        }
        const errText = await response.text();
        console.log(`FAIL (${response.status}): ${errText.slice(0, 100)}`);
        fail++;
      } else {
        console.log('OK');
        success++;
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.log(`ERROR: ${error}`);
      fail++;
    }
  }

  console.log(`\nDone! Success: ${success}, Failed: ${fail}, Total: ${published.length}`);
}

importPosts().catch(e => { console.error('Fatal:', e); process.exit(1); });
