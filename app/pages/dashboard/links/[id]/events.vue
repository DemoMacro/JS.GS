<script setup lang="ts">
definePageMeta({
  title: "Events - Link Details - Dashboard - JS.GS",
});

const linkId = useRoute().params.id as string;
const { link } = useLinkDetail(linkId);

// Receive range from parent layout
const props = defineProps<{
  range?: {
    start: Date;
    end: Date;
  };
}>();
</script>

<template>
  <DashboardLinkDetailEvents v-if="link" :link-id="linkId" :range="props.range" />
</template>
