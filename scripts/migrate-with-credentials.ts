#!/usr/bin/env tsx
/**
 * Ghost to SonicJS Migration - Automated with Credentials
 * Uses provided credentials to authenticate and import all Ghost posts
 */

import fs from 'fs';

// Configuration
const GHOST_EXPORT_PATH = '/Users/chesterbeard/Library/Caches/com.apple.SwiftUI.Drag-5B1D7228-9C73-4EBF-A504-6E6060ED50E5/nourished-journeys.ghost.2026-04-22-23-05-23.json';
const SONICJS_API_URL = 'https://sonicjscms.buzzuw2.workers.dev';
const COLLECTION_ID = 'col-blog-posts-94b7858e';

// Credentials (SonicJS default admin)
const ADMIN_EMAIL = 'admin@sonicjs.com';
const ADMIN_PASSWORD = 'sonicjs!';

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

async function loginAndGetToken(): Promise<string> {
  console.log('🔐 Authenticating with SonicJS...');
  
  try {
    const response = await fetch(`${SONICJS_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Login failed (${response.status}): ${errorData.error || 'Invalid credentials'}`);
    }

    const data = await response.json();
    console.log(`✅ Login successful! User: ${data.user.email} (${data.user.role})`);
    return data.token;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

async function migrate() {
  console.log('🚀 Ghost to SonicJS Migration - Automated Mode\n');
  console.log(`🎯 Target: ${SONICJS_API_URL}`);
  console.log(`📂 Collection ID: ${COLLECTION_ID}`);
  console.log(`📄 Ghost Export: ${GHOST_EXPORT_PATH}\n`);

  // Step 1: Load Ghost export
  console.log('📖 Loading Ghost export file...');
  const ghostExport = JSON.parse(fs.readFileSync(GHOST_EXPORT_PATH, 'utf-8'));
  const db = ghostExport.db?.[0]?.data;
  
  if (!db) {
    console.error('❌ ERROR: Invalid Ghost export format');
    process.exit(1);
  }

  const posts: GhostPost[] = db.posts || [];
  const tags = db.tags || [];
  const authors = db.users || [];

  console.log(`✅ Found ${posts.length} total posts`);
  console.log(`✅ Found ${tags.length} tags`);
  console.log(`✅ Found ${authors.length} authors\n`);

  // Step 2: Authenticate
  const token = await loginAndGetToken();
  console.log('');

  // Step 3: Map Ghost posts to SonicJS format
  console.log('🔄 Mapping Ghost posts to SonicJS format...');
  
  const tagMap = new Map<string, string>(tags.map(t => [t.id, t.name]));
  const authorMap = new Map<string, string>(authors.map(a => [a.id, a.name]));

  const postsToImport: any[] = [];
  
  for (const post of posts) {
    // Skip pages and drafts
    if (post.type === 'page' || post.slug === 'about' || post.status !== 'published') {
      console.log(`⏭️  Skipping: ${post.title} (${post.slug}) - ${post.type === 'page' ? 'page' : post.status}`);
      continue;
    }

    // Extract tags - handle both nested and flat tag structures
    let postTags: string[] = [];
    if (post.tags && Array.isArray(post.tags)) {
      postTags = post.tags
        .map((t: any) => {
          // Handle both {id, name} objects and direct tag objects
          if (typeof t === 'object' && t.name) {
            return t.name;
          } else if (typeof t === 'object' && t.id && tagMap.has(t.id)) {
            return tagMap.get(t.id);
          }
          return null;
        })
        .filter((t): t is string => t !== null && t !== undefined);
    }
    
    const tagsString = postTags.length > 0 ? postTags.join(', ') : '';

    // Generate excerpt
    const excerpt =
      post.custom_excerpt ||
      (post.plaintext && post.plaintext.slice(0, 160)) ||
      post.title;

    // Get author
    let author = 'Chester Beard';
    if (post.authors && post.authors.length > 0) {
      const authorId = post.authors[0]?.id;
      if (authorId && authorMap.has(authorId)) {
        const mappedAuthor = authorMap.get(authorId);
        if (mappedAuthor) {
          author = mappedAuthor;
        }
      }
    }

    postsToImport.push({
      title: post.title,
      slug: post.slug,
      excerpt,
      content: post.html,
      featuredImage: post.feature_image || '',
      author,
      publishedAt: post.published_at,
      tags: tagsString,
      status: 'published',
    });
  }

  console.log(`✅ Prepared ${postsToImport.length} posts for import\n`);

  // Step 4: Import posts to SonicJS
  console.log('📤 Importing posts to SonicJS...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let retryCount = 0;
  const maxRetries = 3;

  for (let i = 0; i < postsToImport.length; i++) {
    const post = postsToImport[i];
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        process.stdout.write(`   [${i + 1}/${postsToImport.length}] ${post.title}... `);
        
        const response = await fetch(`${SONICJS_API_URL}/api/content`, {
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
            data: post,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          if (response.status === 401 && attempt < maxRetries) {
            // Token might have expired, re-authenticate
            console.log('⚠️  Token expired, re-authenticating...');
            const newToken = await loginAndGetToken();
            continue;
          }
          
          console.log(`❌ Failed (${response.status})`);
          console.error(`      Error: ${errorText}`);
          errorCount++;
        } else {
          console.log('✅');
          successCount++;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        break; // Success or final attempt, move to next post
        
      } catch (error) {
        console.log(`❌ Exception: ${error}`);
        errorCount++;
        break;
      }
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Successfully imported: ${successCount}`);
  console.log(`   ❌ Failed to import: ${errorCount}`);
  console.log(`   📦 Total posts processed: ${postsToImport.length}\n`);

  if (successCount === postsToImport.length) {
    console.log('🎉 All posts migrated successfully!');
  } else if (successCount > 0) {
    console.log('⚠️  Partial migration completed. Some posts failed to import.');
  } else {
    console.log('❌ Migration failed. No posts were imported.');
  }

  console.log('\nNext steps:');
  console.log('1. Verify posts in SonicJS admin dashboard');
  console.log('2. Check that all post slugs are correct');
  console.log('3. Verify images are loading from Unsplash URLs');
  console.log('4. Run: pnpm build && pnpm dev');
  console.log('5. Visit http://localhost:4321 to see migrated content\n');
}

// Run migration
migrate().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
