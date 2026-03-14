<script setup lang="ts">
definePageMeta({
  title: "Edit - Link Details - Dashboard - JS.GS",
});

const linkId = useRoute().params.id as string;
</script>

<template>
  <DashboardLinkDetailEdit :link-id="linkId" :back-to="`/dashboard/links/${linkId}`" />
</template>
