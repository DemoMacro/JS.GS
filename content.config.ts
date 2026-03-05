import { defineContentConfig, defineCollection } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    content_en: defineCollection({
      type: "page",
      source: {
        include: "en/*.md",
        prefix: "/",
      },
    }),
    content_zh_cn: defineCollection({
      type: "page",
      source: {
        include: "zh_cn/*.md",
        prefix: "/",
      },
    }),
  },
});
