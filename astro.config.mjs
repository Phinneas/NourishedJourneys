// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

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

  vite: {
    plugins: [tailwindcss()],
  },

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
    sitemap(),
    pagefind(),

    partytown({
      config: {
        forward: ["dataLayer.push"],
        debug: false,
      },
    }),
  ],
});
