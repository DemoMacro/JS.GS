<script setup lang="ts">
definePageMeta({
  layout: "app",
  title: "Privacy Policy - JS.GS",
  description: "Learn how JS.GS collects, uses, and protects your personal information.",
});

const { locale } = useI18n();

// Fetch all data from the collection
const { data: privacy } = await useAsyncData("privacy", () => {
  return queryCollection(`content_${locale.value}`)
    .where("stem", "=", `${locale.value}/privacy`)
    .first();
});

// Set SEO metadata
if (privacy.value) {
  useSeoMeta({
    title: privacy.value.title,
    description: privacy.value.description,
  });
}
</script>

<template>
  <div class="min-h-screen py-12">
    <UContainer>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="mb-4 text-4xl font-bold">
          {{ privacy?.title || "Privacy Policy" }}
        </h1>
        <p class="text-lg">
          {{ privacy?.description }}
        </p>
        <p v-if="privacy?.meta.date" class="mt-2 text-sm opacity-75">
          Last updated: {{ privacy.meta.date }}
        </p>
      </div>

      <!-- Content -->
      <div class="mx-auto max-w-4xl">
        <ContentRenderer v-if="privacy" :value="privacy" />
      </div>
    </UContainer>
  </div>
</template>
