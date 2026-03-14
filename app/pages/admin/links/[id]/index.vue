<script setup lang="ts">
definePageMeta({
  title: "Overview - Link Details - Admin - JS.GS",
});

const linkId = useRoute().params.id as string;

// Receive range from parent layout
const props = defineProps<{
  range?: {
    start: Date;
    end: Date;
  };
}>();
</script>

<template>
  <DashboardLinkDetailOverview :link-id="linkId" :range="props.range" />
</template>
