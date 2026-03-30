<script setup lang="ts">
definePageMeta({
  title: "Links - Dashboard - JS.GS",
});

const toast = useToast();
const { t } = useI18n();

// Define emits
const emit = defineEmits<{
  refresh: [];
}>();
</script>

<template>
  <UDashboardPanel id="links">
    <template #header>
      <UDashboardNavbar :title="t('admin.links')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <DashboardLinksTable mode="organization" @refresh="emit('refresh')" />
    </template>
  </UDashboardPanel>
</template>
