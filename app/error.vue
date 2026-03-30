<script setup lang="ts">
import type { NuxtError } from "#app";

const { t, locale } = useI18n();

defineProps<{
  error: NuxtError;
}>();

useSeoMeta({
  title: () => t("common.pageNotFound"),
  description: () => t("common.pageNotFoundDesc"),
});

useHead({
  htmlAttrs: {
    lang: locale.value,
  },
});
</script>

<template>
  <UApp>
    <UError :error="error" />
  </UApp>
</template>
