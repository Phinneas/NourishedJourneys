// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

// Base Page Metadata, src/layouts/BaseLayout.astro
export const BRAND_NAME = "Nourished Journeys";
export const SITE_TITLE = "Nourished Journeys";
export const SITE_DESCRIPTION = "A place for calm thoughtful reflection, journaling ideas, meditation and breath work discovery.";
export const LIGHT_THEME = 'light';
export const DARK_THEME = 'light';

// Tags Page Metadata, src/pages/tags/index.astro
export const Tags_TITLE = "Nourished Journeys - All Topics";
export const Tags_DESCRIPTION =
  "Nourished Journeys - All topics and the count of articles related to each topic";

// Tags Page Metadata, src/pages/tags/[tag]/[page].astro
export function getTagMetadata(tag: string) {
  return {
    title: `All articles on '${tag}' topic in Nourished Journeys`,
    description: `Explore articles about ${tag} for different perspectives and in-depth analysis.`,
  };
}

// Category Page Metadata, src/pages/category/[category]/[page].astro
export function getCategoryMetadata(category: string) {
  return {
    title: `All articles in '${category}' category in Nourished Journeys`,
    description: `Browse all articles under the ${category} category in Nourished Journeys`,
  };
}

// Header Links with dropdown support
// "Journal" maps to /resources/ (download PDFs), "Method" maps to /about/
export const HeaderLinks = [
  {
    title: "Guides",
    children: [
      { href: "/page/1/", title: "All Guides" },
      { href: "/tags/", title: "By Topic" },
      { href: "/breathing-visualizer/", title: "Breathing Visualizer" },
    ],
  },
  {
    title: "Journal",
    children: [
      { href: "/resources/", title: "Download PDFs" },
    ],
  },
  {
    title: "Method",
    children: [
      { href: "/about/", title: "About" },
    ],
  },
];

// Footer Links, src/components/Footer.astro
export const FooterLinks = [
  { href: "/about/", title: "About" },
  { href: "/tags/", title: "All Topics" },
  { href: "/search/", title: "Search" },
];

// Social Links, src/components/Footer.astro
export const SocialLinks = [
  { href: "/rss.xml", label: "RSS" },
];

// Search Page Metadata, src/pages/search.astro
export const SEARCH_PAGE_TITLE = `${SITE_TITLE} - Site Search`;
export const SEARCH_PAGE_DESCRIPTION = `Search all content on ${SITE_TITLE}`;
