#!/usr/bin/env tsx
/**
 * Ghost to SonicJS Migration with API Authentication
 * Automatically obtains JWT token and imports all Ghost posts
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Configuration
const GHOST_EXPORT_PATH = '/Users/chesterbeard/Library/Caches/com.apple.SwiftUI.Drag-5B1D7228-9C73-4EBF-A504-6E6060ED50E5/nourished-journeys.ghost.2026-04-22-23-05-23.json';
const SONICJS_API_URL = 'https://sonicjscms.buzzuw2.workers.dev';
const COLLECTION_ID = 'col-blog-posts-94b7858e';

interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  html: string;
  plaintext: string;
  feature_image?: string;
  published_at: string;
  updated_at: string;
  custom_excerpt?: string;
  status: string;
  tags: Array<{ id: string; name: string; slug: string }>;
  authors: Array<{ id: string; name: string; slug: string }>;
  type?: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

interface Author {
  id: string;
  name: string;
  slug: string;
}

interface SonicJSPostData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  author: string;
  publishedAt: string;
  tags: string;
  status: string;
}

interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  token: string;
}

// Read user input from terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function loginAndGetToken(apiUrl: string): Promise<string> {
  console.log('🔐 SonicJS Login Required\n');
  
  const email = await askQuestion('📧 Enter your admin email: ');
  const password = await askQuestion('🔑 Enter your password: ');
  
  console.log('\n🔄 Attempting login...');
  
  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Login failed (${response.status}): ${errorData.error || 'Invalid credentials'}`);
    }

    const data: LoginResponse = await response.json();
    console.log('✅ Login successful!');
    console.log(`   User: ${data.user.email}`);
    console.log(`   Role: ${data.user.role}\n`);
    
    return data.token;
  } catch (error) {
    console.error(`❌ Login error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    rl.close();
    process.exit(1);
  }
}

async function loadGhostExport(): Promise<{ posts: GhostPost[], tags: Tag[], authors: Author[] }> {
  console.log('📖 Loading Ghost export file...');
  
  try {
    const ghostExport = JSON.parse(fs.readFileSync(GHOST_EXPORT_PATH, 'utf-8'));
    const db = ghostExport.db?.[0]?.data;
    
    if (!db) {
      throw new Error('Invalid Ghost export format - missing db data');
    }

    const posts: GhostPost[] = db.posts || [];
    const tags: Tag[] = db.tags || [];
    const authors: Author[] = db.users || [];

    console.log(`✅ Found ${posts.length} posts`);
    console.log(`✅ Found ${tags.length} tags`);
    console.log(`✅ Found ${authors.length} authors\n`);
    
    return { posts, tags, authors };
  } catch (error) {
    console.error(`❌ Error loading Ghost export: ${error instanceof Error ? error.message : 'Unknown error'}`);
    rl.close();
    process.exit(1);
  }
}

async function mapGhostToSonicJS(posts: GhostPost[], tags: Tag[], authors: Author[]): Promise<SonicJSPostData[]> {
  console.log('🔄 Mapping Ghost posts to SonicJS format...');
  
  const postsToImport: SonicJSPostData[] = [];
  const tagMap = new Map(tags.map(t => [t.id, t.name]));
  const authorMap = new Map(authors.map(a => [a.id, a.name]));
  
  let skippedCount = 0;
  
  for (const post of posts) {
    // Skip pages like About - only migrate blog posts
    if (post.type === 'page' || post.slug === 'about') {
      console.log(`⏭️  Skipping: ${post.title} (${post.slug}) - page`);
      skippedCount++;
      continue;
    }

    if (post.status !== 'published') {
      console.log(`⏭️  Skipping: ${post.title} (${post.slug}) - ${post.status}`);
      skippedCount++;
      continue;
    }

    // Extract tags as comma-separated string
    const postTags = post.tags
      .map(t => tagMap.get(t.id))
      .filter((t): t is string => t !== undefined);

    const tagsString = postTags.length > 0 ? postTags.join(', ') : 'General';

    // Generate excerpt if not present
    const excerpt =
      post.custom_excerpt ||
      (post.plaintext && post.plaintext.slice(0, 160)) ||
      post.title;

    const sonicPostData: SonicJSPostData = {
      title: post.title,
      slug: post.slug,
      excerpt,
      content: post.html,
      featuredImage: post.feature_image,
      author: authorMap.get(post.authors[0]?.id) || 'Chester Beard',
      publishedAt: post.published_at,
      tags: tagsString,
      status: 'published',
    };

    postsToImport.push(sonicPostData);
  }

  console.log(`✅ Prepared ${postsToImport.length} posts for import`);
  console.log(`⏭️  Skipped ${skippedCount} posts/pages\n`);
  
  return postsToImport;
}

async function importPostsToSonicJS(posts: SonicJSPostData[], apiUrl: string, token: string): Promise<void> {
  console.log('📤 Importing posts to SonicJS...');
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ post: string; error: string }> = [];

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    
    try {
      console.log(`   [${i + 1}/${posts.length}] Importing: ${post.title.substring(0, 50)}...`);

      const response = await fetch(`${apiUrl}/api/content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          collectionId: COLLECTION_ID,
          title: post.title,
          slug: post.slug,
          status: post.status,
          publishedAt: new Date(post.publishedAt).getTime(),
          data: {
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            featuredImage: post.featuredImage,
            author: post.author,
            publishedAt: post.publishedAt,
            tags: post.tags,
            status: post.status,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `${response.status} - ${errorText}`;
        console.error(`      ❌ Failed: ${errorMsg}`);
        errors.push({ post: post.title, error: errorMsg });
        errorCount++;
      } else {
        console.log(`      ✅ Success`);
        successCount++;
      }

      // Rate limiting: wait between requests
      if (i < posts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`      ❌ Error: ${errorMsg}`);
      errors.push({ post: post.title, error: errorMsg });
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successfully imported: ${successCount}`);
  console.log(`   ❌ Failed to import: ${errorCount}`);
  console.log(`   📦 Total posts processed: ${posts.length}`);

  if (errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    errors.forEach(({ post, error }) => {
      console.log(`   • ${post.substring(0, 40)}...: ${error}`);
    });
  }
}

async function main() {
  console.log('🚀 Ghost to SonicJS Migration - API Authentication Mode\n');
  console.log(`🎯 Target: ${SONICJS_API_URL}`);
  console.log(`📂 Collection ID: ${COLLECTION_ID}`);
  console.log(`📄 Ghost Export: ${GHOST_EXPORT_PATH}\n`);

  try {
    // Step 1: Login and get token
    const token = await loginAndGetToken(SONICJS_API_URL);

    // Step 2: Load Ghost export
    const { posts, tags, authors } = await loadGhostExport();

    // Step 3: Map to SonicJS format
    const postsToImport = await mapGhostToSonicJS(posts, tags, authors);

    // Step 4: Import to SonicJS
    await importPostsToSonicJS(postsToImport, SONICJS_API_URL, token);

    console.log('\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify posts in SonicJS admin dashboard');
    console.log('2. Check that all post slugs are correct');
    console.log('3. Verify images are loading properly');
    console.log('4. Test fetching posts via API');

    rl.close();
  } catch (error) {
    console.error('\n💥 Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    rl.close();
    process.exit(1);
  }
}

// Run migration
main();
