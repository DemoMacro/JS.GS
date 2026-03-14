<script setup lang="ts">
definePageMeta({
  layout: "app",
  title: "Terms of Service - JS.GS",
  description:
    "Read our Terms of Service to understand your rights and responsibilities when using JS.GS.",
});

const { locale } = useI18n();

// Fetch all data from the collection
const { data: terms } = await useAsyncData("terms", () => {
  return queryCollection(`content_${locale.value}`)
    .where("stem", "=", `${locale.value}/terms`)
    .first();
});

// Set SEO metadata
if (terms.value) {
  useSeoMeta({
    title: terms.value.title,
    description: terms.value.description,
  });
}
</script>

<template>
  <div class="min-h-screen py-12">
    <UContainer>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="mb-4 text-4xl font-bold">
          {{ terms?.title || "Terms of Service" }}
        </h1>
        <p class="text-lg">
          {{ terms?.description }}
        </p>
        <p v-if="terms?.meta.date" class="mt-2 text-sm opacity-75">
          Last updated: {{ terms.meta.date }}
        </p>
      </div>

      <!-- Content -->
      <div class="mx-auto max-w-4xl">
        <ContentRenderer v-if="terms" :value="terms" />
      </div>
    </UContainer>
  </div>
</template>
