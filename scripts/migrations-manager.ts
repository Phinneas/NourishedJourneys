#!/usr/bin/env tsx
/**
 * SonicJS Migration Manager Utility
 * Provides comprehensive migration tools for Ghost to SonicJS content
 * Supports multiple migration strategies and provides diagnostic utilities
 */

import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

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

interface MigrationStats {
  totalPosts: number;
  blogPosts: number;
  pages: number;
  drafts: number;
  publishedPosts: number;
  totalTags: number;
  totalAuthors: number;
  imageCount: number;
}

async function analyzeGhostExport(): Promise<MigrationStats> {
  console.log('🔍 Analyzing Ghost export file...\n');
  
  try {
    const ghostExport = JSON.parse(fs.readFileSync(GHOST_EXPORT_PATH, 'utf-8'));
    const db = ghostExport.db?.[0]?.data;
    
    if (!db) {
      throw new Error('Invalid Ghost export format');
    }

    const posts: GhostPost[] = db.posts || [];
    const tags = db.tags?.length || 0;
    const authors = db.users?.length || 0;

    const stats: MigrationStats = {
      totalPosts: posts.length,
      blogPosts: posts.filter(p => p.type !== 'page').length,
      pages: posts.filter(p => p.type === 'page').length,
      drafts: posts.filter(p => p.status === 'draft').length,
      publishedPosts: posts.filter(p => p.status === 'published' && p.type !== 'page').length,
      totalTags: tags,
      totalAuthors: authors,
      imageCount: posts.filter(p => p.feature_image).length,
    };

    console.log('📊 Ghost Export Analysis:');
    console.log(`   Total posts: ${stats.totalPosts}`);
    console.log(`   Blog posts: ${stats.blogPosts}`);
    console.log(`   Pages: ${stats.pages}`);
    console.log(`   Drafts: ${stats.drafts}`);
    console.log(`   Published blog posts: ${stats.publishedPosts}`);
    console.log(`   Tags: ${stats.totalTags}`);
    console.log(`   Authors: ${stats.totalAuthors}`);
    console.log(`   Posts with images: ${stats.imageCount}\n`);

    return stats;
  } catch (error) {
    console.error('❌ Error analyzing Ghost export:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

async function checkSonicJSDiagnostics(): Promise<void> {
  console.log('🔍 Running SonicJS diagnostics...\n');

  // Check API connectivity
  console.log('1. Checking SonicJS API connectivity...');
  try {
    const response = await fetch(`${SONICJS_API_URL}/api/health`);
    if (response.ok) {
      console.log('   ✅ API is accessible');
    } else {
      console.log(`   ⚠️  API returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('   ❌ API is not accessible');
    console.log(`      ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Check collections
  console.log('\n2. Checking collections...');
  try {
    const response = await fetch(`${SONICJS_API_URL}/api/collections`);
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Found ${data.data?.length || 0} collections`);
      
      const blogCollection = data.data?.find((c: any) => c.id === COLLECTION_ID);
      if (blogCollection) {
        console.log(`   ✅ Blog Posts collection found: ${blogCollection.display_name}`);
        console.log(`      Schema fields: ${blogCollection.schema?.fields?.length || 0}`);
      } else {
        console.log(`   ⚠️  Blog Posts collection not found (ID: ${COLLECTION_ID})`);
      }
    } else {
      console.log(`   ⚠️  Could not retrieve collections (${response.status})`);
    }
  } catch (error) {
    console.log('   ❌ Error checking collections');
    console.log(`      ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n');
}

async function checkWranglerSetup(): Promise<void> {
  console.log('🔍 Checking Wrangler setup...\n');

  // Check if wrangler is installed
  try {
    execSync('wrangler --version', { encoding: 'utf-8' });
    console.log('   ✅ Wrangler is installed');
  } catch (error) {
    console.log('   ❌ Wrangler is not installed');
    console.log('      Install with: npm install -g wrangler');
    return;
  }

  // Check wrangler.toml
  const wranglerConfigPath = path.join(process.cwd(), 'wrangler.toml');
  if (fs.existsSync(wranglerConfigPath)) {
    console.log('   ✅ wrangler.toml found');
    const config = fs.readFileSync(wranglerConfigPath, 'utf-8');
    if (config.includes('d1_databases')) {
      console.log('   ✅ D1 database binding configured');
    } else {
      console.log('   ⚠️  D1 database binding not found in wrangler.toml');
    }
  } else {
    console.log('   ❌ wrangler.toml not found');
  }

  // Check local D1 database
  try {
    // Just verify wrangler works for D1 commands
    execSync('wrangler d1 --help', { encoding: 'utf-8' });
    console.log('   ✅ Wrangler D1 commands available');
  } catch (error) {
    console.log('   ⚠️  Wrangler D1 commands not available');
  }

  console.log('\n');
}

function generateMigrationReport(stats: MigrationStats): void {
  console.log('📋 Migration Recommendations:\n');

  console.log('🎯 Recommended Migration Strategy:');
  
  if (stats.publishedPosts <= 20) {
    console.log('   Use: API-based migration (migrate-api-auth.ts)');
    console.log('   ✅ Pros: Simple, follows API conventions, good for small datasets');
    console.log('   ❌ Cons: Requires login, rate limited, slower for large datasets');
  } else {
    console.log('   Use: Direct D1 migration (migrate-d1-direct.ts)');
    console.log('   ✅ Pros: Fast, no rate limits, works locally, can run anytime');
    console.log('   ❌ Cons: Requires Wrangler setup, bypasses API validation');
  }

  console.log('\n📊 Recommended Post Processing:');
  
  if (stats.imageCount > 0) {
    console.log('   • Featured images found - verify image URLs are accessible');
    console.log('   • Consider migrating images to SonicJS R2 storage');
  }

  if (stats.drafts > 0) {
    console.log(`   • ${stats.drafts} drafts found - consider if they should be imported`);
  }

  if (stats.pages > 0) {
    console.log(`   • ${stats.pages} pages found - ensure they aren't incorrectly imported as blog posts`);
  }

  console.log('\n🔍 Pre-Migration Checklist:');
  console.log('   ✅ Verify SonicJS admin credentials work');
  console.log('   ✅ Backup existing SonicJS content (if any)');
  console.log('   ✅ Ensure collection schema matches Ghost field structure');
  console.log('   ✅ Test with a single post before full migration');
  console.log('   ✅ Clear SonicJS cache after migration');

  console.log('\n⚠️  Important Notes:');
  console.log('   • This migration creates content in the Blog Posts collection');
  console.log('   • Content will be marked as "published" status');
  console.log('   • Original Ghost IDs are preserved when possible');
  console.log('   • Tags are converted to comma-separated strings');
  console.log('   • Author information is mapped to SonicJS users');

  console.log('\n');
}

async function displayUsageInstructions(): Promise<void> {
  console.log('📖 Migration Script Usage:\n');

  console.log('🚀 Option 1: API-Based Migration (Recommended for < 20 posts)');
  console.log('   Run: cd /Users/chesterbeard/Desktop/nourishedjourneys');
  console.log('        npx tsx scripts/migrate-api-auth.ts');
  console.log('   This will:');
  console.log('   • Prompt for SonicJS admin credentials');
  console.log('   • Automatically obtain JWT token');
  console.log('   • Import posts one by one via API');
  console.log('');

  console.log('🚀 Option 2: Direct D1 Migration (Recommended for 20+ posts)');
  console.log('   Run: cd /Users/chesterbeard/Desktop/nourishedjourneys');
  console.log('        npx tsx scripts/migrate-d1-direct.ts');
  console.log('   This will:');
  console.log('   • Generate SQL INSERT statements');
  console.log('   • Execute via Wrangler CLI');
  console.log('   • Import all posts in batch');
  console.log('');

  console.log('🔍 Diagnostic Mode:');
  console.log('   Run: npx tsx scripts/migrations-manager.ts');
  console.log('   This will:');
  console.log('   • Analyze Ghost export');
  console.log('   • Check SonicJS connectivity');
  console.log('   • Verify Wrangler setup');
  console.log('   • Provide recommendations');
  console.log('');

  console.log('🧪 Test Migration (Single Post):');
  console.log('   Before full migration, test with 1 post:');
  console.log('   1. Review generated migration script output');
  console.log('   2. Verify single post imports correctly');
  console.log('   3. Check images, tags, and');
  console.log('   4. Test post URL structure');
  console.log('');
}

async function main() {
  console.log('🔧 SonicJS Migration Manager\n');
  console.log('🎯 Ghost Export: ' + path.basename(GHOST_EXPORT_PATH));
  console.log('🎯 SonicJS URL: ' + SONICJS_API_URL);
  console.log('🎯 Collection ID: ' + COLLECTION_ID + '\n');
  console.log('=' .repeat(60) + '\n');

  // Analyze Ghost export
  const stats = await analyzeGhostExport();

  // Check SonicJS diagnostics
  await checkSonicJSDiagnostics();

  // Check Wrangler setup
  await checkWranglerSetup();

  // Generate migration report
  generateMigrationReport(stats);

  // Display usage instructions
  displayUsageInstructions();

  console.log('💡 Ready to migrate! Choose your strategy above.\n');
}

// Run migration manager
main().catch(error => {
  console.error('💥 Fatal error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
});
