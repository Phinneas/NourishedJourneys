// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

import sitemap from "@astrojs/sitemap";
import { remarkModifiedTime } from "./src/utils/remark-modified-time.mjs";
import partytown from "@astrojs/partytown";
import pagefind from "astro-pagefind";

// https://astro.build/config
export default defineConfig({
  site: "https://www.nourishedjourneys.com",
  trailingSlash: "always",

  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },

  experimental: {},

  image: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },

  markdown: {
    remarkPlugins: [remarkModifiedTime],
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        const path = url.pathname;
        // Drop the duplicate/low-value routes from the sitemap.
        if (path === "/404/") return false;
        if (path === "/search/") return false;
        // Paginated homepage: /page/1/ canonicals to /, /page/2+/ are noindex.
        if (path.startsWith("/page/")) return false;
        // Tag/category pagination: keep only page 1.
        if (path.match(/^\/tags\/[^/]+\/([2-9]|[1-9]\d+)\//)) return false;
        if (path.match(/^\/category\/[^/]+\/([2-9]|[1-9]\d+)\//)) return false;
        // Anything with a query string.
        if (url.search) return false;
        return true;
      },
    }),
    pagefind(),

    partytown({
      config: {
        forward: ["dataLayer.push"],
        debug: false,
      },
    }),
  ],
});
