<script setup lang="ts">
definePageMeta({
  title: "Links - Admin - JS.GS",
});

const toast = useToast();

// Define emits
const emit = defineEmits<{
  (e: "refresh"): void;
}>();
</script>

<template>
  <UDashboardPanel id="admin-links">
    <template #header>
      <UDashboardNavbar title="Links">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <DashboardLinksTable mode="admin" @refresh="emit('refresh')" />
    </template>
  </UDashboardPanel>
</template>
