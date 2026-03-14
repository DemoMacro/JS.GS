<script setup lang="ts">
definePageMeta({
  title: "Edit - Link Details - Admin - JS.GS",
});

const linkId = useRoute().params.id as string;
</script>

<template>
  <DashboardLinkDetailEdit :link-id="linkId" :back-to="`/admin/links/${linkId}`" />
</template>
