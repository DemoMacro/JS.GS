<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

// Navigation items
const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t("common.overview"),
      icon: "i-lucide-building",
      to: `/dashboard/org`,
      exact: true,
    },
    {
      label: t("common.members"),
      icon: "i-lucide-users",
      to: `/dashboard/org/members`,
    },
    {
      label: t("common.security"),
      icon: "i-lucide-shield",
      to: `/dashboard/org/security`,
    },
  ],
]);
</script>

<template>
  <UDashboardPanel id="organization-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar
        :title="`${t('dashboard.org')} - ${activeOrg?.name || t('common.unknown')}`"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="!activeOrg" class="py-8 text-center">
        <UIcon name="i-lucide-building" class="text-muted-foreground mx-auto mb-4 size-12" />
        <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
          {{ t("dashboard.noActiveOrg") }}
        </h3>
        <p class="text-muted-foreground mb-4">
          {{ t("dashboard.noActiveOrgDesc") }}
        </p>
        <UButton to="/dashboard/create-org">
          <template #leading>
            <UIcon name="i-lucide-plus" />
          </template>
          {{ t("dashboard.createOrg") }}
        </UButton>
      </div>

      <div v-else class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
