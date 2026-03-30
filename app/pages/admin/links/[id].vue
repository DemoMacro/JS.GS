<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { useDomains } from "~/composables/useDomains";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const linkId = route.params.id as string;

const toast = useToast();

const { link, loading, fetchLink } = useLinkDetail(linkId);
const { domains } = useDomains();

const { copy, copied, isSupported } = useClipboard();

// Helper function to get the actual domain for a link
function getLinkDomain() {
  if (!link.value?.domainId) {
    return window.location.origin;
  }
  const domainId = link.value.domainId;
  const domain = domains.value.find((d) => d.id === domainId);
  return domain?.domainName || window.location.origin;
}

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

async function copyToClipboard() {
  if (!link.value) {
    return;
  }

  if (!isSupported.value) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.clipboardNotSupported"),
      color: "error",
    });
    return;
  }

  const domain = getLinkDomain();
  const url = `${domain}/s/${link.value.shortCode}`;
  await copy(url);
}

// Get analytics composables - they create and manage their own refs
const { range } = useLinkAnalytics(linkId);

const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t("common.overview"),
      icon: "i-lucide-link",
      to: `/admin/links/${linkId}`,
      exact: true,
    },
    {
      label: t("common.events"),
      icon: "i-lucide-list",
      to: `/admin/links/${linkId}/events`,
    },
    {
      label: t("common.edit"),
      icon: "i-lucide-edit",
      to: `/admin/links/${linkId}/edit`,
    },
  ],
]);
</script>

<template>
  <UDashboardPanel id="admin-link-details">
    <template #header>
      <UDashboardNavbar :title="`Link - ${link?.shortCode || t('common.unknown')}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <div v-if="link" class="flex items-center gap-2">
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              :title="t('admin.copyLink')"
              @click="copyToClipboard"
            />

            <UPopover>
              <UButton
                icon="i-lucide-qr-code"
                color="neutral"
                variant="ghost"
                :title="t('admin.showQrCode')"
              />

              <template #content>
                <div class="p-4">
                  <img
                    :src="`/qr/${link.shortCode}`"
                    :alt="`QR Code for ${link.shortCode}`"
                    class="h-32 w-32"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
        </template>

        <template #right>
          <DashboardLinkDateRangePicker v-model="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex h-64 items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
      </div>

      <div v-else-if="!link" class="py-8 text-center">
        <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
          {{ t("admin.linkNotFound") }}
        </h3>
        <p class="text-muted-foreground mb-4">
          {{ t("admin.linkNotFoundDesc") }}
        </p>
        <UButton to="/admin/links">{{ t("admin.backToLinks") }}</UButton>
      </div>

      <div v-else class="mx-auto flex h-full w-full flex-col gap-4 sm:gap-6 lg:gap-12">
        <NuxtPage :range="range" />
      </div>
    </template>
  </UDashboardPanel>
</template>
