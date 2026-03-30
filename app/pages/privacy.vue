<script setup lang="ts">
const { t, locale } = useI18n();

definePageMeta({
  layout: "app",
});

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
          {{ privacy?.title || t("privacy.title") }}
        </h1>
        <p class="text-lg">
          {{ privacy?.description }}
        </p>
        <p v-if="privacy?.meta.date" class="mt-2 text-sm opacity-75">
          {{ t("common.lastUpdated") }} {{ privacy.meta.date }}
        </p>
      </div>

      <!-- Content -->
      <div class="mx-auto max-w-4xl">
        <ContentRenderer v-if="privacy" :value="privacy" />
      </div>
    </UContainer>
  </div>
</template>
