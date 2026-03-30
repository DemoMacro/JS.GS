<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

// Navigation items
const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t("dashboard.profile"),
      icon: "i-lucide-user",
      to: "/dashboard/settings",
      exact: true,
    },
    {
      label: t("dashboard.security"),
      icon: "i-lucide-shield",
      to: "/dashboard/settings/security",
    },
    {
      label: t("dashboard.invitations"),
      icon: "i-lucide-mail",
      to: "/dashboard/settings/invitations",
    },
  ],
]);
</script>

<template>
  <UDashboardPanel id="user-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="t('common.settings')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
