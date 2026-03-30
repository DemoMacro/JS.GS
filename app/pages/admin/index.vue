<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

interface Stat {
  title: string;
  icon: string;
  value: number;
  variation?: number;
}

// Use admin stats composable
const { totalUsers, totalOrgs, adminUsers, activeSessions, loading, fetchStats } = useStats();

// Define stats data
const stats = computed<Stat[]>(() => [
  {
    title: t("admin.totalUsers"),
    icon: "i-lucide-users",
    value: totalUsers.value,
    variation: 0,
  },
  {
    title: t("admin.organizations"),
    icon: "i-lucide-building",
    value: totalOrgs.value,
    variation: 0,
  },
  {
    title: t("admin.adminUsers"),
    icon: "i-lucide-shield",
    value: adminUsers.value,
    variation: 0,
  },
  {
    title: t("admin.activeSessions"),
    icon: "i-lucide-activity",
    value: activeSessions.value,
    variation: 0,
  },
]);

// Load stats on mount
onMounted(() => {
  fetchStats();
});

const items = computed(
  () =>
    [
      [
        {
          label: t("admin.createUser"),
          icon: "i-lucide-user-plus",
          to: "/admin/users/create",
        },
        {
          label: t("admin.createOrganization"),
          icon: "i-lucide-building",
          to: "/admin/orgs/create",
        },
      ],
    ] satisfies DropdownMenuItem[][],
);
</script>

<template>
  <UDashboardPanel id="admin-index">
    <template #header>
      <UDashboardNavbar :title="t('admin.title')" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UPageGrid class="gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-px">
        <UPageCard
          v-for="(stat, index) in stats"
          :key="index"
          :icon="stat.icon"
          :title="stat.title"
          to="/admin/users"
          variant="subtle"
          :ui="{
            container: 'gap-y-1.5',
            wrapper: 'items-start',
            leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
            title: 'font-normal text-muted text-xs uppercase',
          }"
          class="first:rounded-l-lg last:rounded-r-lg hover:z-1 lg:rounded-none"
        >
          <div v-if="loading" class="flex items-center gap-2">
            <UIcon name="i-lucide-loader-2" class="text-muted-foreground size-4 animate-spin" />
            <span class="text-muted-foreground text-sm">{{ t("common.loading") }}</span>
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-highlighted text-2xl font-semibold">
              {{ stat.value.toLocaleString() }}
            </span>

            <UBadge
              v-if="stat.variation && stat.variation !== 0"
              :color="stat.variation > 0 ? 'success' : 'error'"
              variant="subtle"
            >
              {{ stat.variation > 0 ? "+" : "" }}{{ stat.variation }}%
            </UBadge>
          </div>
        </UPageCard>
      </UPageGrid>

      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ t("admin.quickActions") }}</h3>
          <p class="text-muted-foreground text-sm">{{ t("admin.commonTasks") }}</p>
        </template>

        <UPageGrid class="gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UButton to="/admin/users" variant="outline" class="justify-start">
            <UIcon name="i-lucide-users" class="mr-2" />
            {{ t("admin.manageUsers") }}
          </UButton>

          <UButton to="/admin/orgs" variant="outline" class="justify-start">
            <UIcon name="i-lucide-building" class="mr-2" />
            {{ t("admin.manageOrganizations") }}
          </UButton>

          <UButton to="/admin/users/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-user-plus" class="mr-2" />
            {{ t("admin.createUser") }}
          </UButton>

          <UButton to="/admin/orgs/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-building" class="mr-2" />
            {{ t("admin.createOrganization") }}
          </UButton>
        </UPageGrid>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>
