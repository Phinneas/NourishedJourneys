# NourishedJourneys Deployment Guide

## Quick Deployment Options

### Option A: New GitHub Repository (Recommended)

1. **Create a new GitHub repository** at https://github.com/new
   - Repository name: `nourishedjourneys` (or your preferred name)
   - Make it Public or Private
   - Don't initialize with README (we have existing content)

2. **Push to your new repository:**
```bash
cd /Users/chesterbeard/Desktop/nourishedjourneys
git remote set-url origin https://github.com/YOUR_USERNAME/nourishedjourneys.git
git push -u origin main
```

3. **Connect to Cloudflare Pages:**
   - Go to: https://dash.cloudflare.com/
   - Navigate to: Workers & Pages → Create application → Pages → Connect to Git
   - Select your GitHub repository
   - Set build settings:
     ```
     Build command: pnpm build
     Build output directory: dist
     Node.js version: 20
     ```

4. **Add environment variables:**
   - Set `SONICJS_API_URL` = `https://sonicjscms.buzzuw2.workers.dev/api`
   - Set `GA_MEASUREMENT_ID` = Your Google Analytics ID (when available)

5. **Deploy!** Cloudflare Pages will automatically build and deploy.

### Option B: Direct Deployment without Git

1. **Build the project:**
```bash
cd /Users/chesterbeard/Desktop/nourishedjourneys
pnpm build
```

2. **Deploy using Wrangler:**
```bash
npx wrangler pages publish dist
```

## Post-Deployment Steps

### 1. Update DNS (After Deployment)

**Current DNS:** NourishedJourneys.com → PikaPods Ghost instance

**After Cloudflare Deployment:**
- Go to AWS Route 53
- Update DNS records:
  ```
  nourishedjourneys.com     CNAME  <your-project>.pages.dev
  www.nourishedjourneys.com CNAME  <your-project>.pages.dev
  ```

### 2. Import Ghost Content into SonicJS

The site is deployed with placeholder SonicJS content. To show your actual posts:

1. **Navigate to SonicJS Admin:** https://sonicjscms.buzzuw2.workers.dev/admin/dashboard
2. **Go to Blog Posts collection**
3. **Import your Ghost posts** using the prepared JSON file:
   - File location: `/Users/chesterbeard/Desktop/nourishedjourneys/ghost-export-for-sonicjs.json`
   - This contains 50 blog posts formatted for SonicJS
   - If bulk import isn't available, manual entry will be needed

### 3. Verify Deployment

- **Home page:** `https://www.nourishedjourneys.com/`
- **About page:** `https://www.nourishedjourneys.com/about/`
- **Tag pages:** `https://www.nourishedjourneys.com/tag/mindfulness/1/`
- **RSS feed:** `https://www.nourishedjourneys.com/rss.xml`
- **Sitemap:** `https://www.nourishedjourneys.com/sitemap-index.xml`

### 4. Monitor Performance

- Check Core Web Vitals via Lighthouse
- Verify all 50 Ghost posts load at correct URLs
- Test mobile responsiveness
- Confirm SEO meta tags are correct

## Troubleshooting

### Build Errors
- Ensure Node.js 20+ is installed
- Check `pnpm build` works locally first

### SonicJS Connection Errors
- Verify `SONICJS_API_URL` is correct in environment variables
- Check SonicJS instance is accessible
- API is public (no auth needed for read access)

### DNS Issues
- DNS changes can take 5-30 minutes to propagate
- Use DNS lookup tools to verify propagation
- Check Cloudflare SSL certificate status

## Technical Details

- **Framework:** Astro 5.x (Static site generation)
- **CMS:** SonicJS (Cloudflare Workers + D1)
- **Hosting:** Cloudflare Pages
- **Development:** Adapts from AstroMelody v0.8.1
- **Content:** 50 Ghost posts migrated to flat URL structure

## Support Files

- **Migration script:** `scripts/migrate-ghost-to-sonicjs.ts`
- **Ghost export:** `ghost-export-for-sonicjs.json`
- **Environment template:** `.env.example`
