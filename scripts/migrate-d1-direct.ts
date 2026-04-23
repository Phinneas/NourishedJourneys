#!/usr/bin/env tsx
/**
 * Ghost to SonicJS Migration - Direct D1 Database Insertion
 * Bypasses API by directly inserting content into D1 database via Wrangler
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

// Configuration
const GHOST_EXPORT_PATH = '/Users/chesterbeard/Library/Caches/com.apple.SwiftUI.Drag-5B1D7228-9C73-4EBF-A504-6E6060ED50E5/nourished-journeys.ghost.2026-04-22-23-05-23.json';
const COLLECTION_ID = 'col-blog-posts-94b7858e';
const WRANGLER_DB_NAME = 'sonicjscms'; // Adjust based on your wrangler.toml
const OUTPUT_SQL_FILE = path.join(__dirname, '../temp/ghost-migration.sql');

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

interface SonicJSContentRow {
  id: string;
  collection_id: string;
  slug: string;
  title: string;
  data: string; // JSON string
  status: string;
  published_at: number;
  author_id: string;
  created_at: number;
  updated_at: number;
}

// First, we need to find or create an admin user ID
async function getFirstAuthorId(): Promise<string> {
  console.log('🔍 Finding first author ID in database...');
  
  try {
    const result = execSync(
      `wrangler d1 execute ${WRANGLER_DB_NAME} --command="SELECT id FROM users LIMIT 1" --local`,
      { encoding: 'utf-8', cwd: path.dirname(__dirname) }
    );
    
    const lines = result.trim().split('\n');
    if (lines.length > 1) {
      const userId = lines[1].trim(); // Skip header row
      console.log(`✅ Found author ID: ${userId}`);
      return userId;
    }
    
    // If no user found, create a default one
    console.log('⚠️  No users found. Creating default admin user...');
    const newUserId = `user-${Date.now()}`;
    const timestamp = Date.now();
    
    const createUserSQL = `
INSERT INTO users (id, email, username, first_name, last_name, role, is_active, created_at, updated_at)
VALUES (
  '${newUserId}',
  'chester@nourishedjourneys.com',
  'chesterbeard',
  'Chester',
  'Beard',
  'admin',
  1,
  ${timestamp},
  ${timestamp}
);
    `;
    
    execSync(
      `wrangler d1 execute ${WRANGLER_DB_NAME} --command="${createUserSQL.replace(/\n/g, ' ')}" --local`,
      { encoding: 'utf-8', cwd: path.dirname(__dirname) }
    );
    
    console.log(`✅ Created default admin user: ${newUserId}`);
    return newUserId;
  } catch (error) {
    console.error('❌ Error finding/creating user:', error instanceof Error ? error.message : 'Unknown error');
    return 'user-default';
  }
}

async function verifyCollectionExists(collectionId: string): Promise<boolean> {
  console.log(`🔍 Verifying collection exists: ${collectionId}`);
  
  try {
    const result = execSync(
      `wrangler d1 execute ${WRANGLER_DB_NAME} --command="SELECT id FROM collections WHERE id = '${collectionId}'" --local`,
      { encoding: 'utf-8', cwd: path.dirname(__dirname) }
    );
    
    return result.trim().includes(collectionId);
  } catch (error) {
    console.error('❌ Error checking collection:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

function loadGhostExport(): { posts: GhostPost[], tags: Tag[], authors: Author[] } {
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
    throw error;
  }
}

function generateContentId(): string {
  return `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function escapeSQLString(text: string): string {
  return text.replace(/'/g, "''");
}

function generateSQLStatements(
  posts: GhostPost[],
  tags: Tag[],
  authors: Author[],
  authorId: string,
  collectionId: string
): string[] {
  console.log('🔄 Generating SQL INSERT statements...');
  
  const sqlStatements: string[] = [];
  const tagMap = new Map(tags.map(t => [t.id, t.name]));
  const authorMap = new Map(authors.map(a => [a.id, a.name]));
  
  let skippedCount = 0;
  
  for (const post of posts) {
    // Skip pages like About - only migrate blog posts
    if (post.type === 'page' || post.slug === 'about') {
      console.log(`⏭️  Skipping: ${post.title.substring(0, 40)}... - page`);
      skippedCount++;
      continue;
    }

    if (post.status !== 'published') {
      console.log(`⏭️  Skipping: ${post.title.substring(0, 40)}... - ${post.status}`);
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

    // Prepare data JSON
    const dataJson = JSON.stringify({
      title: post.title,
      slug: post.slug,
      excerpt: excerpt,
      content: post.html,
      featuredImage: post.feature_image,
      author: authorMap.get(post.authors[0]?.id) || 'Chester Beard',
      publishedAt: post.published_at,
      tags: tagsString,
      status: 'published',
    });

    // Convert published_at to timestamp
    const publishedAt = new Date(post.published_at).getTime();
    const createdAt = Date.now();
    const updatedAt = Date.now();
    const contentId = generateContentId();

    // Generate SQL INSERT statement
    const sql = `
INSERT INTO content (id, collection_id, slug, title, data, status, published_at, author_id, created_at, updated_at)
VALUES (
  '${contentId}',
  '${collectionId}',
  '${post.slug}',
  '${escapeSQLString(post.title)}',
  '${escapeSQLString(dataJson)}',
  'published',
  ${publishedAt},
  '${authorId}',
  ${createdAt},
  ${updatedAt}
);
`;
    
    sqlStatements.push(sql);
  }

  console.log(`✅ Generated ${sqlStatements.length} SQL statements`);
  console.log(`⏭️  Skipped ${skippedCount} posts/pages\n`);
  
  return sqlStatements;
}

async function writeSQLToFile(sqlStatements: string[]): Promise<void> {
  console.log('📝 Writing SQL statements to file...');
  
  try {
    const sqlContent = `
-- Ghost to SonicJS Migration SQL
-- Generated: ${new Date().toISOString()}
-- Collection ID: ${COLLECTION_ID}
-- Number of posts: ${sqlStatements.length}

${sqlStatements.join('\n')}
`;
    
    fs.writeFileSync(OUTPUT_SQL_FILE, sqlContent);
    console.log(`✅ SQL file written to: ${OUTPUT_SQL_FILE}`);
    console.log(`   File size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error('❌ Error writing SQL file:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function executeSQLWithWrangler(sqlFile: string): Promise<void> {
  console.log('🚀 Executing SQL with Wrangler...');
  console.log('⏳ This may take a few minutes for large datasets...\n');
  
  try {
    execSync(
      `wrangler d1 execute ${WRANGLER_DB_NAME} --file="${sqlFile}" --local`,
      { 
        encoding: 'utf-8', 
        cwd: path.dirname(__dirname),
        stdio: 'inherit'
      }
    );
    
    console.log('\n✅ SQL execution completed successfully!');
  } catch (error) {
    console.error('\n❌ Error executing SQL:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function verifyImportedContent(expectedCount: number): Promise<void> {
  console.log('🔍 Verifying imported content...');
  
  try {
    const result = execSync(
      `wrangler d1 execute ${WRANGLER_DB_NAME} --command="SELECT COUNT(*) as count FROM content WHERE collection_id = '${COLLECTION_ID}'" --local`,
      { encoding: 'utf-8', cwd: path.dirname(__dirname) }
    );
    
    const lines = result.trim().split('\n');
    const count = lines.length > 1 ? parseInt(lines[1].trim()) : 0;
    
    console.log(`✅ Found ${count} posts in collection`);
    
    if (count === expectedCount) {
      console.log('🎉 Import verification successful!');
    } else {
      console.log(`⚠️  Expected ${expectedCount} posts, found ${count}`);
    }
  } catch (error) {
    console.error('❌ Error verifying content:', error instanceof Error ? error.message : 'Unknown error');
  }
}

async function main() {
  console.log('🚀 Ghost to SonicJS Migration - Direct D1 Database Mode\n');
  console.log(`🎯 Collection ID: ${COLLECTION_ID}`);
  console.log(`📄 Ghost Export: ${GHOST_EXPORT_PATH}`);
  console.log(`🗄️  Database: ${WRANGLER_DB_NAME}\n`);

  try {
    // Step 1: Verify collection exists
    const collectionExists = await verifyCollectionExists(COLLECTION_ID);
    if (!collectionExists) {
      console.error(`❌ Collection ${COLLECTION_ID} does not exist!`);
      console.error('   Please create the collection first or verify the collection ID.');
      process.exit(1);
    }

    // Step 2: Get or create author ID
    const authorId = await getFirstAuthorId();

    // Step 3: Load Ghost export
    const { posts, tags, authors } = loadGhostExport();

    // Step 4: Generate SQL statements
    const sqlStatements = generateSQLStatements(posts, tags, authors, authorId, COLLECTION_ID);

    if (sqlStatements.length === 0) {
      console.log('⚠️  No posts to import. Exiting.');
      process.exit(0);
    }

    // Step 5: Write SQL to file
    await writeSQLToFile(sqlStatements);

    // Step 6: Execute SQL with Wrangler
    await executeSQLWithWrangler(OUTPUT_SQL_FILE);

    // Step 7: Verify import
    await verifyImportedContent(sqlStatements.length);

    console.log('\n🎉 Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify posts in SonicJS admin dashboard');
    console.log('2. Check that all post slugs are correct');
    console.log('3. Verify images are loading properly');
    console.log('4. Clear SonicJS cache to force refresh');
    console.log('5. Test fetching posts via SonicJS API');

  } catch (error) {
    console.error('\n💥 Fatal error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('\n💡 Troubleshooting tips:');
    console.error('1. Ensure wrangler is configured correctly');
    console.error('2. Check that D1 database binding exists in wrangler.toml');
    console.error('3. Verify the collection ID is correct');
    console.error('4. Make sure you have local D1 database initialized');
    process.exit(1);
  }
}

// Run migration
main();
