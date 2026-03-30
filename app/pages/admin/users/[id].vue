<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const userId = route.params.id as string;

// Use composable for user data
const { user, loading } = useUser(userId);

// Navigation items
const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t("common.overview"),
      icon: "i-lucide-user",
      to: `/admin/users/${userId}`,
      exact: true,
    },
    {
      label: t("common.security"),
      icon: "i-lucide-shield",
      to: `/admin/users/${userId}/security`,
    },
  ],
]);
</script>

<template>
  <UDashboardPanel id="user-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="`User - ${user?.name || user?.email || t('common.unknown')}`">
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
      <div v-if="loading" class="flex h-64 items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
      </div>

      <div v-else-if="!user" class="py-8 text-center">
        <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
          {{ t("admin.userNotFound") }}
        </h3>
        <p class="text-muted-foreground mb-4">
          {{ t("admin.userNotFoundDesc") }}
        </p>
        <UButton to="/admin/users">{{ t("admin.backToUsers") }}</UButton>
      </div>

      <div v-else class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
