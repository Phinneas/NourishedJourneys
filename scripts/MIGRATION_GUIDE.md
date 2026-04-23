# Ghost to SonicJS Migration Guide

## Overview

This guide provides comprehensive automated solutions for migrating 50 Ghost blog posts from NourishedJourneys.com to SonicJS.

## Migration Status

- **Source**: Ghost export (54 total posts: 50 published, 3 drafts, 1 page)
- **Target**: SonicJS CMS at https://sonicjscms.buzzuw2.workers.dev
- **Collection**: Blog Posts (col-blog-posts-94b7858e)
- **Authentication**: Automated JWT token acquisition via login

## Available Migration Solutions

### Option 1: API-Based Migration ✨ (Recommended for Start)

**Script**: `migrate-api-auth.ts`

**When to use**: First migration attempt, testing, or fewer than 20 posts

**How it works**:
1. Prompts for SonicJS admin credentials
2. Automatically obtains JWT authentication token
3. Imports posts one by one via SonicJS REST API
4. Includes rate limiting and error handling

**Pros**:
- ✅ Follows API conventions and validation
- ✅ Simple and straightforward
- ✅ Real-time feedback during import
- ✅ Proper authentication flow

**Cons**:
- ❌ Rate limiting slows down large imports
- ❌ Requires admin credentials
- ❌ Dependent on API availability

**Usage**:
```bash
npx tsx scripts/migrate-api-auth.ts
```

---

### Option 2: Direct D1 Migration 🚀 (Recommended for Production)

**Script**: `migrate-d1-direct.ts`

**When to use**: Production migration, 20+ posts, or faster imports

**How it works**:
1. Analyzes Ghost export and generates SQL INSERT statements
2. Creates or finds admin user for author attribution
3. Executes SQL directly into D1 database via Wrangler
4. Handles all posts in batch operation

**Pros**:
- ✅ Very fast - no rate limiting
- ✅ Works locally, can run anytime
- ✅ No dependency on API availability
- ✅ Can handle large datasets efficiently

**Cons**:
- ❌ Bypasses API-level validation
- ❌ Requires Wrangler configuration
- ❌ Needs D1 database binding setup

**Usage**:
```bash
npx tsx scripts/migrate-d1-direct.ts
```

**Requirements**:
- Wrangler CLI installed
- D1 database binding in wrangler.toml
- Local D1 database initialized

---

### Option 3: Migration Manager 📊 (Diagnostics & Planning)

**Script**: `migrations-manager.ts`

**When to use**: Pre-migration analysis, troubleshooting, or planning

**How it works**:
1. Analyzes Ghost export structure
2. Checks SonicJS API connectivity and collections
3. Verifies Wrangler setup and D1 configuration
4. Provides migration recommendations

**Usage**:
```bash
npx tsx scripts/migrations-manager.ts
```

---

## Migration Analysis Results

### Ghost Export Breakdown
- **Total posts**: 54
- **Published blog posts**: 50 (target for migration)
- **Pages**: 1 (excluded: About page)
- **Drafts**: 3 (excluded unless needed)
- **Tags**: 5
- **Authors**: 1
- **Posts with images**: 52

### SonicJS Configuration
- **API Status**: ✅ Accessible
- **Collections**: ✅ 3 found
- **Blog Posts Collection**: ✅ Found with correct ID
- **Wrangler Setup**: ✅ Installed and configured

**Note**: D1 database binding not found in wrangler.toml - need to configure for Direct D1 migration.

---

## Recommended Migration Strategy

Based on the analysis (50 posts to migrate), I recommend:

### Phase 1: Test Migration (1-2 posts)
1. Run `migrations-manager.ts` to verify setup
2. Test with API-based migration to validate field mapping
3. Check imported posts in SonicJS admin dashboard
4. Verify images, tags, and content formatting

### Phase 2: Full Migration (all 50 posts)
**Use Option 2: Direct D1 Migration** for efficiency:
```bash
npx tsx scripts/migrate-d1-direct.ts
```

### Phase 3: Post-Migration Validation
1. Verify all 50 posts appear in SonicJS
2. Check post URLs and slugs are correct
3. Test post content and images load properly
4. Clear SonicJS cache to force refresh
5. Test SonicJS API returns correct content

---

## Field Mapping

| Ghost Field | SonicJS Field | Notes |
|-------------|---------------|-------|
| title | title/data.title | Direct mapping |
| slug | slug/data.slug | Direct mapping |
| html | data.content | Preserves HTML formatting |
| plaintext | data.excerpt | First 160 chars, or custom excerpt |
| custom_excerpt | data.excerpt | If available |
| featured_image | data.featuredImage | Preserves Unsplash URLs |
| published_at | data.publishedAt | ISO-8601 format |
| authors[0].name | data.author | Defaults to "Chester Beard" |
| tags | data.tags | Comma-separated tag names |
| status | status | converts to "published" |

---

## Pre-Migration Checklist

✅ **Configuration**
- [ ] Verify SonicJS admin credentials work
- [ ] Check collection ID is correct: `col-blog-posts-94b7858e`
- [ ] Ensure Wrangler is installed: `wrangler --version`

✅ **Data Validation**
- [ ] Review Ghost export for any unusual data
- [ ] Check image URLs are accessible
- [ ] Verify tags are correct

✅ **System Setup**
- [ ] Backup existing SonicJS content (if any)
- [ ] Test with single post first
- [ ] Clear SonicJS cache after migration

---

## Troubleshooting

### API Migration Issues

**Problem**: "Login failed - Invalid credentials"
- **Solution**: Verify admin credentials are correct
- **Check**: Use SonicJS admin dashboard to test login

**Problem**: "Rate limit exceeded"
- **Solution**: Use Direct D1 migration instead
- **Alternative**: Add longer delays between API calls

**Problem**: "Collection not found"
- **Solution**: Verify collection ID in `migrations-manager.ts`
- **Check**: Admin dashboard shows all 3 collections

### Direct D1 Migration Issues

**Problem**: "D1 database binding not found"
- **Solution**: Add to wrangler.toml:
```toml
[[d1_databases]]
binding = "DB"
database_name = "sonicjscms"
database_id = "your-database-id"
```

**Problem**: "No users found in database"
- **Solution**: Script automatically creates default admin user
- **Check**: Verify user creation in script output

**Problem**: "SQL execution failed"
- **Solution**: Check SQL file in `temp/ghost-migration.sql`
- **Debug**: Manually execute with `wrangler d1 execute DB --file=temp/ghost-migration.sql`

---

## Post-Migration Steps

1. **Verify Content**
   - Check all 50 posts appear in SonicJS admin
   - Test random posts for proper formatting
   - Verify images load correctly

2. **Clear Caches**
   - Clear SonicJS memory cache (if available)
   - Clear KV cache (if configured)
   - Test API returns fresh data

3. **Test Integration**
   - Verify Astro site fetches posts correctly
   - Check post URLs work: `domain.com/slug/`
   - Test RSS feed generation

4. **Monitor SEO**
   - Check 404 errors for changed URLs
   - Verify meta tags are preserved
   - Test sitemap includes all posts

---

## Key Files Reference

### Migration Scripts
- `scripts/migrate-api-auth.ts` - API-based migration (recommended for testing)
- `scripts/migrate-d1-direct.ts` - Direct D1 migration (recommended for production)
- `scripts/migrations-manager.ts` - Diagnostics and analysis tool
- `scripts/migrate-ghost-to-sonicjs.ts` - Original migration (requires API token)

### Data Files
- `ghost-export-for-sonicjs.json` - Pre-mapped Ghost export (ready-to-use)
- Original export: `nourished-journeys.ghost.2026-04-22-23-05-23.json`

 Generated output:
- `temp/ghost-migration.sql` - SQL statements (D1 migration)
- Console output with real-time progress

---

## Security Considerations

1. **Credentials Handling**
   - API-based: Credentials entered interactively, not stored
   - D1-based: No credentials required

2. **Data Validation**
   - Scripts validate Ghost export structure
   - D1 migration escapes SQL to prevent injection
   - All posts checked for required fields

3. **Error Handling**
   - Graceful failure on individual posts
   - Detailed error reporting
   - Rollback not supported - preparation recommended

---

## Performance Expectations

### API-Based Migration
- **Speed**: ~1 post per second (with rate limiting)
- **Total time**: ~50 seconds for 50 posts
- **Network usage**: Moderate (API calls)

### Direct D1 Migration
- **Speed**: ~50 posts in <5 seconds (batch operation)
- **Network usage**: Minimal (SQL execution)
- **Database impact**: One transaction for all posts

---

## Support & Customization

### Custom Field Mapping
Edit the migration scripts to add/modify field mappings in the `generateSQLStatements` or `mapGhostToSonicJS` functions.

### Filtering Posts
Modify the filter logic to include/exclude specific posts:
```typescript
// Example: Only import posts published after 2025
if (new Date(post.published_at) < new Date('2025-01-01')) {
  continue; // Skip this post
}
```

### Error Recovery
Scripts include error tracking and reporting. Failed migrations can be:
1. Reviewed in console output
2. Manually fixed in SQL file
3. Re-ran for specific post IDs

---

## Conclusion

The recommended approach for NourishedJourneys.com migration:

1. **Start**: Run `npx tsx scripts/migrations-manager.ts` for diagnostics
2. **Test**: Use `npx tsx scripts/migrate-api-auth.ts` with 2 posts to validate
3. **Production**: Use `npx tsx scripts/migrate-d1-direct.ts` for full migration
4. **Validate**: Check imported posts in SonicJS admin dashboard
5. **Deploy**: Clear caches and verify production site

Total estimated time: **10-15 minutes** for complete migration including validation.

---

## Quick Reference Commands

```bash
# Diagnostics
npx tsx scripts/migrations-manager.ts

# Test Migration (API-based)
npx tsx scripts/migrate-api-auth.ts

# Full Migration (D1-based)
npx tsx scripts/migrate-d1-direct.ts

# Manual SQL Check
wrangler d1 execute sonicjscms --file=temp/ghost-migration.sql --local

# Verify Import
wrangler d1 execute sonicjscms --command="SELECT COUNT(*) FROM content WHERE collection_id='col-blog-posts-94b7858e'" --local
```

---

**Last Updated**: 2026-04-22
**Migration Target**: NourishedJourneys.com → SonicJS
**Posts to Migrate**: 50 published Ghost blog posts
**Status**: ✅ Ready for migration
