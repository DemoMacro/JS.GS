<script setup lang="ts">
const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
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
      <UDashboardNavbar :title="t('admin.links')">
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
