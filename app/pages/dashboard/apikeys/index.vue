<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();
const { copy, copied } = useClipboard();

const table = useTemplateRef("table");
const globalFilter = ref("");
const columnVisibility = ref();
const rowSelection = ref({});

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Fetch API keys using useAsyncData with SSR support and automatic caching
const {
  data: apiKeysData,
  pending: loading,
  refresh: fetchApiKeys,
  error,
} = await useAsyncData(
  "api-keys",
  async () => {
    const result = await authClient.apiKey.list({
      query: {
        limit: pagination.value.pageSize,
        offset: pagination.value.pageIndex * pagination.value.pageSize,
      },
    });
    return result.data;
  },
  {
    transform: (data) => ({
      apiKeys: data?.apiKeys ?? [],
      total: data?.total ?? 0,
    }),
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize],
  },
);

const apiKeys = computed(() => apiKeysData.value?.apiKeys ?? []);
const total = computed(() => apiKeysData.value?.total ?? 0);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.failedToFetchApiKeys"),
      color: "error",
    });
  }
});

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: t("common.success"),
      description: t("dashboard.apiKeyCopied"),
      color: "success",
    });
  }
});

// Delete API key
async function deleteApiKey(keyId: string, keyName: string) {
  const confirmed = confirm(t("dashboard.deleteApiKeyConfirm", { name: keyName }));
  if (!confirmed) return;

  try {
    const result = await authClient.apiKey.delete({
      keyId,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || "Failed to delete API key",
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.apiKeyDeleted", { name: keyName }),
      color: "success",
    });

    // Refresh the list
    await fetchApiKeys();
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : "Failed to delete API key",
      color: "error",
    });
  }
}

// Format date
function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Check if API key is expired
function isExpired(expiresAt: number | null): boolean {
  if (!expiresAt) return false;
  return Date.now() > expiresAt;
}

// Table columns
const columns: TableColumn<any>[] = [
  {
    accessorKey: "name",
    header: () => t("common.name"),
  },
  {
    accessorKey: "enabled",
    header: () => t("common.status"),
  },
  {
    accessorKey: "expiresAt",
    header: () => t("common.expires"),
  },
  {
    accessorKey: "lastUsed",
    header: () => t("common.lastUsed"),
  },
  {
    accessorKey: "createdAt",
    header: () => t("common.created"),
  },
  {
    accessorKey: "actions",
    header: () => t("common.actions"),
  },
];

// Pagination items
const paginationItems = computed(() => [
  { label: t("dashboard.perPage", { count: 10 }), value: 10 },
  { label: t("dashboard.perPage", { count: 25 }), value: 25 },
  { label: t("dashboard.perPage", { count: 50 }), value: 50 },
  { label: t("dashboard.perPage", { count: 100 }), value: 100 },
]);
</script>

<template>
  <UDashboardPanel id="api-keys">
    <template #header>
      <UDashboardNavbar :title="t('dashboard.apiKeys')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-1 flex-col gap-4">
        <!-- Search and Controls -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <UInput
            v-model="globalFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="t('dashboard.searchApiKey')"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton to="/dashboard/apikeys/create" :label="t('dashboard.createApiKey')">
              <template #leading>
                <UIcon name="i-lucide-plus" />
              </template>
            </UButton>

            <USelect v-model="pagination.pageSize" :items="paginationItems" class="min-w-32" />
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
              getPaginationRowModel: getPaginationRowModel(),
            }"
            :data="apiKeys"
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
            <template #name-cell="{ row }">
              <span class="text-sm font-medium">{{ row.getValue("name") }}</span>
            </template>

            <template #enabled-cell="{ row }">
              <UBadge :color="row.getValue('enabled') ? 'success' : 'neutral'" variant="subtle">
                {{ row.getValue("enabled") ? t("common.active") : t("common.disabled") }}
              </UBadge>
            </template>

            <template #expiresAt-cell="{ row }">
              <UBadge v-if="!row.original.expiresAt" color="neutral" variant="subtle">
                {{ t("common.never") }}
              </UBadge>
              <UBadge v-else-if="isExpired(row.original.expiresAt)" color="error" variant="subtle">
                {{ t("common.expired") }}
              </UBadge>
              <UBadge v-else color="success" variant="subtle">
                {{ formatDate(row.original.expiresAt) }}
              </UBadge>
            </template>

            <template #lastUsed-cell="{ row }">
              <span v-if="!row.original.lastUsed" class="text-muted-foreground text-sm">
                {{ t("common.never") }}
              </span>
              <span v-else class="text-sm">
                {{ formatDate(row.original.lastUsed) }}
              </span>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-sm">
                {{ formatDate(row.original.createdAt) }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  variant="ghost"
                  icon="i-lucide-trash"
                  color="error"
                  size="sm"
                  :title="t('dashboard.deleteApiKey')"
                  @click="deleteApiKey(row.original.id, row.getValue('name'))"
                />
              </div>
            </template>

            <template #empty>
              <div class="flex flex-col items-center justify-center py-12 text-center">
                <UIcon name="i-lucide-key" class="text-muted-foreground mb-4 size-12" />
                <h3 class="mb-2 text-lg font-semibold">{{ t("dashboard.noApiKeys") }}</h3>
                <p class="text-muted-foreground mb-4 max-w-md">
                  {{ t("dashboard.noApiKeysDesc") }}
                </p>
                <UButton to="/dashboard/apikeys/create" :label="t('dashboard.createFirstApiKey')" />
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div class="text-muted-foreground text-sm">
            Showing
            {{ table?.tableApi?.getFilteredRowModel().rows.length ?? 0 }} of {{ total }} API keys
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :default-page="(table?.tableApi?.getState().pagination.pageIndex ?? 0) + 1"
              :items-per-page="table?.tableApi?.getState().pagination.pageSize"
              :total="table?.tableApi?.getFilteredRowModel().rows.length ?? 0"
              @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
            />
          </div>
        </div>

        <!-- Info Section -->
        <div class="border-default border-t pt-4">
          <UAlert icon="i-lucide-info" color="neutral" :title="t('dashboard.apiKeyUsage')">
            <template #description>
              <span class="inline">{{ t("dashboard.apiKeyUsageDesc") }}</span>
              <NuxtLink to="/api/reference" target="_blank" class="inline hover:underline">
                {{ t("dashboard.viewApiDocs") }}
              </NuxtLink>
            </template>
          </UAlert>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
