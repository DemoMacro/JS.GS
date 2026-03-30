<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { LinkWithDetails } from "~~/shared/types/link";

import { useDomains } from "~/composables/useDomains";
import { authClient } from "~/utils/auth";

const { t } = useI18n();

interface Props {
  /**
   * View mode for the table
   * - "organization": Show links for current organization
   * - "admin": Show all links (admin only)
   */
  mode?: "organization" | "admin";
  /**
   * Additional filters to apply
   */
  filters?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "organization",
  filters: () => ({}),
});

const table = useTemplateRef("table");
const globalFilter = ref("");
const columnVisibility = ref();
const rowSelection = ref({});

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

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
  if (personalOrg.value && !activeOrg.value && props.mode === "organization") {
    await authClient.organization.setActive({
      organizationId: personalOrg.value.id,
    });
  }
});

// Get current session
const { data: session } = await authClient.useSession(useFetch);
const currentUserId = computed(() => session.value?.user?.id);

// Check if current user is admin
const isAdmin = computed(() => session.value?.user?.role === "admin");

// Helper function to get the actual domain for a link
function getLinkDomain(link: LinkWithDetails) {
  if (!link.domainId) {
    return window.location.origin;
  }
  const domain = domains.value.find((d) => d.id === link.domainId);
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

async function copyToClipboard(link: LinkWithDetails) {
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

// Fetch data using useAsyncData with SSR support and automatic caching
const {
  data: linksData,
  pending: loading,
  refresh: fetchLinks,
  error,
} = await useAsyncData(
  props.mode === "admin" ? "all-links" : "links",
  async () => {
    // Build query based on mode and filters
    const query: Record<string, any> = {
      limit: pagination.value.pageSize,
      offset: pagination.value.pageIndex * pagination.value.pageSize,
      ...props.filters,
    };

    // Add organization filter for organization mode
    // Use activeOrg which represents the user's currently selected organization
    if (props.mode === "organization" && activeOrg.value?.id) {
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
    watch: [
      activeOrg,
      personalOrg,
      () => pagination.value.pageIndex,
      () => pagination.value.pageSize,
      () => props.filters,
    ], // Re-fetch when pagination, active organization, or filters change
  },
);

const links = computed(() => linksData.value?.links ?? []);
const total = computed(() => linksData.value?.total ?? 0);

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

const columns = computed<TableColumn<LinkWithDetails>[]>(() => {
  const baseColumns: TableColumn<LinkWithDetails>[] = [
    {
      accessorKey: "title",
      header: t("dashboard.linkTitleField"),
    },
    {
      accessorKey: "shortLink",
      header: t("dashboard.shortLink"),
    },
    {
      accessorKey: "originalUrl",
      header: t("dashboard.destinationUrl"),
    },
    {
      accessorKey: "status",
      header: t("common.status"),
    },
    {
      accessorKey: "actions",
      header: t("common.actions"),
    },
  ];

  // Add Created By column in organization mode or admin mode
  const shouldShowCreatedBy = props.mode === "organization" || props.mode === "admin";
  if (shouldShowCreatedBy) {
    baseColumns.splice(2, 0, {
      accessorKey: "createdBy",
      header: t("dashboard.createdBy"),
    });
  }

  // Add Organization column for admin mode
  if (props.mode === "admin") {
    baseColumns.splice(2, 0, {
      accessorKey: "organization",
      header: t("dashboard.org"),
    });
  }

  return baseColumns;
});

// Define emits
const emit = defineEmits<{
  (e: "refresh"): void;
}>();
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <!-- Search and Controls -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <UInput
        v-model="globalFilter"
        class="max-w-sm"
        icon="i-lucide-search"
        :placeholder="t('dashboard.searchLinks')"
      />

      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="mode === 'organization'"
          to="/dashboard/links/create"
          :label="t('dashboard.addLink')"
        >
          <template #leading>
            <UIcon name="i-lucide-plus" />
          </template>
        </UButton>

        <USelect
          v-model="pagination.pageSize"
          :items="[
            { label: t('dashboard.perPage', { count: 10 }), value: 10 },
            { label: t('dashboard.perPage', { count: 25 }), value: 25 },
            { label: t('dashboard.perPage', { count: 50 }), value: 50 },
            { label: t('dashboard.perPage', { count: 100 }), value: 100 },
          ]"
          class="min-w-32"
        />
      </div>
    </div>

    <!-- Table Container -->
    <div class="flex-1">
      <UTable
        ref="table"
        v-model:global-filter="globalFilter"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          manualPagination: true,
        }"
        :data="links"
        :columns="columns"
        :loading="loading"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
        }"
      >
        <template #title-cell="{ row }">
          <span class="text-sm font-medium">
            {{ row.getValue("title") || row.original.shortCode }}
          </span>
        </template>

        <template #shortLink-cell="{ row }">
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm">
              {{ getLinkDomain(row.original) }}/s/{{ row.original.shortCode }}
            </span>
            <UButton
              variant="ghost"
              size="xs"
              icon="i-lucide-copy"
              :title="t('dashboard.copyLink')"
              @click="copyToClipboard(row.original)"
            />
          </div>
        </template>

        <template #createdBy-cell="{ row }">
          <div class="flex items-center gap-2">
            <div class="bg-primary/10 flex size-6 items-center justify-center rounded-full">
              <UIcon name="i-lucide-user" class="size-3" />
            </div>
            <span class="text-sm">
              {{
                row.original.createdBy === currentUserId
                  ? t("common.you")
                  : row.original.creator?.name || t("common.unknown")
              }}
            </span>
          </div>
        </template>

        <template #organization-cell="{ row }">
          <UBadge v-if="row.original.organization" size="sm" variant="subtle">
            {{ row.original.organization.name }}
          </UBadge>
          <span v-else class="text-muted-foreground text-sm">{{ t("common.noOrganization") }}</span>
        </template>

        <template #originalUrl-cell="{ row }">
          <span class="block max-w-md truncate text-sm">
            {{ row.getValue("originalUrl") }}
          </span>
        </template>

        <template #status-cell="{ row }">
          <UBadge
            :color="row.getValue('status') === 'active' ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ row.getValue("status") }}
          </UBadge>
        </template>

        <template #actions-cell="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              :to="
                mode === 'organization'
                  ? `/dashboard/links/${row.original.id}`
                  : `/admin/links/${row.original.id}`
              "
              variant="ghost"
              icon="i-lucide-eye"
              :title="t('common.viewDetails')"
            />

            <UPopover>
              <UButton variant="ghost" icon="i-lucide-qr-code" :title="t('dashboard.showQrCode')" />

              <template #content>
                <div class="p-4">
                  <img
                    :src="`/qr/${row.original.shortCode}`"
                    :alt="`QR Code for ${row.original.shortCode}`"
                    class="h-32 w-32"
                  />
                </div>
              </template>
            </UPopover>

            <DashboardLinkDeleteModal
              :link="row.original"
              @refresh="
                () => {
                  fetchLinks();
                  emit('refresh' as const);
                }
              "
            >
              <UButton
                variant="ghost"
                icon="i-lucide-trash"
                color="error"
                :title="t('dashboard.deleteLink')"
              />
            </DashboardLinkDeleteModal>
          </div>
        </template>
      </UTable>
    </div>

    <!-- Pagination Footer -->
    <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
      <div class="text-muted-foreground text-sm">
        {{
          t("dashboard.showing", {
            from: pagination.pageIndex * pagination.pageSize + 1,
            to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total),
            total,
          })
        }}
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination
          :page="pagination.pageIndex + 1"
          :items-per-page="pagination.pageSize"
          :total="total"
          @update:page="
            (p: number) => {
              pagination.pageIndex = p - 1;
            }
          "
        />
      </div>
    </div>
  </div>
</template>
