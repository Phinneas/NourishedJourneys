#!/bin/bash

# Ghost to SonicJS Migration - Quick Start Script
# This script helps you choose and run the appropriate migration strategy

echo "🚀 Ghost to SonicJS Migration - Quick Start"
echo "=================================================="
echo ""
echo "Source: Ghost export (50 published posts)"
echo "Target: SonicJS CMS (Blog Posts collection)"
echo "URL: https://sonicjscms.buzzuw2.workers.dev"
echo ""
echo "Please select your migration strategy:"
echo ""
echo "1) 🔍 Run Diagnostics (Recommended first step)"
echo "2) 🚀 API-Based Migration (Test with login credentials)"
echo "3) ⚡ Direct D1 Migration (Fast, production-ready)"
echo "4) 📖 View Migration Guide"
echo "5) ❌ Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
  1)
    echo ""
    echo "🔍 Running diagnostics..."
    npx tsx scripts/migrations-manager.ts
    ;;
  2)
    echo ""
    echo "🚀 Starting API-based migration..."
    echo "This will prompt for your SonicJS admin credentials."
    echo ""
    read -p "Press Enter to continue or Ctrl+C to abort..."
    npx tsx scripts/migrate-api-auth.ts
    ;;
  3)
    echo ""
    echo "⚡ Starting Direct D1 migration..."
    echo "This will generate SQL and execute via Wrangler."
    echo ""
    read -p "Press Enter to continue or Ctrl+C to abort..."
    npx tsx scripts/migrate-d1-direct.ts
    ;;
  4)
    echo ""
    echo "📖 Opening migration guide..."
    echo ""
    cat scripts/MIGRATION_GUIDE.md
    ;;
  5)
    echo ""
    echo "👋 Exiting migration tool."
    exit 0
    ;;
  *)
    echo ""
    echo "❌ Invalid choice. Please run the script again."
    exit 1
    ;;
esac

echo ""
echo "=================================================="
echo "✅ Migration process complete!"
echo ""
echo "Next steps:"
echo "1. Verify posts in SonicJS admin dashboard"
echo "2. Check that all post slugs are correct"
echo "3. Verify images are loading properly"
echo "4. Clear SonicJS cache if needed"
echo ""
echo "For detailed instructions, see: scripts/MIGRATION_GUIDE.md"
echo ""
