<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Link } from "~~/shared/types/link";

import { useDomains } from "~/composables/useDomains";
import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const items = computed(
  () =>
    [
      [
        {
          label: t("dashboard.createLink"),
          icon: "i-lucide-plus",
          onSelect: () => navigateTo("/dashboard/links/create"),
        },
      ],
    ] satisfies DropdownMenuItem[][],
);

const toast = useToast();
const { copy, copied, isSupported } = useClipboard();
const { domains } = useDomains();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

// Get personal organization
const { personalOrg } = useOrganizations();

// Auto-set personal organization as active if no org is active
watchEffect(async () => {
  if (personalOrg.value && !activeOrg.value) {
    await authClient.organization.setActive({
      organizationId: personalOrg.value.id,
    });
  }
});

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: t("common.success"),
      description: t("dashboard.linkCopied"),
      color: "success",
    });
  }
});

// Helper function to get the actual domain for a link
function getLinkDomain(link: Link) {
  if (!link.domainId) {
    return window.location.origin;
  }
  const domain = domains.value.find((d) => d.id === link.domainId);
  return domain?.domainName || window.location.origin;
}

async function copyToClipboard(link: Link) {
  if (!isSupported.value) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.clipboardNotSupported"),
      color: "error",
    });
    return;
  }

  const domain = getLinkDomain(link);
  const url = `${domain}/s/${link.shortCode}`;
  await copy(url);
}

// Fetch recent links (latest 5)
const {
  data: linksData,
  pending: loading,
  refresh,
  error,
} = await useAsyncData(
  "recent-links",
  async () => {
    // Build query based on active organization
    const query: Record<string, any> = { limit: 5 };

    // Use active organization for filtering
    if (activeOrg.value?.id) {
      query.organizationId = activeOrg.value.id;
    }

    const result = await authClient.link.list({
      query,
    });
    return result.data;
  },
  {
    transform: (data) => ({
      links: data?.links ?? [],
      total: data?.total ?? 0,
    }),
    watch: [activeOrg, personalOrg], // Re-fetch when active organization changes
  },
);

const recentLinks = computed(() => linksData.value?.links ?? []);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.failedToFetchLinks"),
      color: "error",
    });
  }
});
</script>

<template>
  <UDashboardPanel id="dashboard-index">
    <template #header>
      <UDashboardNavbar :title="t('dashboard.title')" :ui="{ right: 'gap-3' }">
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
      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ t("dashboard.quickActions") }}</h3>
          <p class="text-muted-foreground text-sm">{{ t("dashboard.commonTasks") }}</p>
        </template>

        <UPageGrid class="gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UButton to="/dashboard/links/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-plus" class="mr-2" />
            {{ t("dashboard.createLink") }}
          </UButton>

          <UButton to="/dashboard/settings" variant="outline" class="justify-start">
            <UIcon name="i-lucide-settings" class="mr-2" />
            {{ t("dashboard.settings") }}
          </UButton>
        </UPageGrid>
      </UPageCard>

      <UCard :ui="{ body: 'px-0 py-3 sm:px-0 sm:py-3' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">{{ t("dashboard.recentLinks") }}</h3>
              <p class="text-muted-foreground text-sm">{{ t("dashboard.recentLinksDesc") }}</p>
            </div>
            <UButton
              to="/dashboard/links"
              variant="ghost"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            >
              {{ t("common.viewAll") }}
            </UButton>
          </div>
        </template>

        <div v-if="loading" class="py-8 text-center">
          <UIcon name="i-lucide-loader-2" class="mx-auto mb-4 size-8 animate-spin" />
          <p class="text-muted-foreground">{{ t("dashboard.loadingLinks") }}</p>
        </div>

        <div v-else-if="recentLinks.length === 0" class="text-muted-foreground py-8 text-center">
          <UIcon name="i-lucide-link" class="mx-auto mb-4 size-12 opacity-50" />
          <p>{{ t("dashboard.noLinks") }}</p>
          <p class="text-sm">{{ t("dashboard.noLinksDesc") }}</p>
        </div>

        <div v-else>
          <template v-for="(link, index) in recentLinks" :key="link.id">
            <div
              class="hover:bg-muted/50 flex w-full items-center justify-between gap-4 px-6 py-3 transition-colors"
            >
              <NuxtLink
                :to="`${getLinkDomain(link)}/s/${link.shortCode}`"
                class="flex min-w-0 flex-1 items-center gap-3"
                target="_blank"
              >
                <UIcon name="i-lucide-link" class="text-muted-foreground size-4 shrink-0" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-medium">
                    {{ link.title || link.shortCode }}
                  </p>
                  <p class="text-muted-foreground truncate text-xs">
                    {{ getLinkDomain(link) }}/s/{{ link.shortCode }}
                  </p>
                </div>
              </NuxtLink>

              <div class="flex shrink-0 items-center gap-1">
                <UButton
                  :to="`/dashboard/links/${link.id}`"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-eye"
                  :title="t('common.viewDetails')"
                />

                <UButton
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-copy"
                  :title="t('dashboard.copyLink')"
                  @click="copyToClipboard(link)"
                />

                <DashboardLinkDeleteModal :link="link" @refresh="refresh">
                  <UButton
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-trash"
                    color="error"
                    :title="t('dashboard.deleteLink')"
                  />
                </DashboardLinkDeleteModal>
              </div>
            </div>
            <USeparator v-if="index < recentLinks.length - 1" />
          </template>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>
