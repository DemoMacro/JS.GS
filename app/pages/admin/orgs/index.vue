<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { Organization } from "better-auth/plugins";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

// Table state
const table = useTemplateRef("table");
const columnFilters = ref([
  {
    id: "name",
    value: "",
  },
]);
const columnVisibility = ref();
const rowSelection = ref({});

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

const toast = useToast();
const searchValue = ref("");

// Fetch organizations using useAsyncData with SSR support
const {
  data: orgsData,
  pending: loading,
  refresh: fetchOrganizations,
  error,
} = await useAsyncData(
  "admin-organizations",
  async () => {
    const result = await authClient.organization.list({
      query: {
        limit: pagination.value.pageSize,
        offset: pagination.value.pageIndex * pagination.value.pageSize,
        searchValue: searchValue.value || undefined,
        sortBy: "name",
      },
    });
    return result.data;
  },
  {
    transform: (data) => ({
      organizations: data ?? [],
      total: data?.length ?? 0,
    }),
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, searchValue],
  },
);

const organizations = computed(() => orgsData.value?.organizations ?? []);
const total = computed(() => orgsData.value?.total ?? 0);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: t("common.error"),
      description: t("admin.failedToFetchOrganizations"),
      color: "error",
    });
  }
});

// Watch for search changes - sync search input with searchValue
watch(
  () => columnFilters.value[0]?.value,
  (newValue) => {
    searchValue.value = newValue || "";
  },
);

// Table columns
const columns = computed<TableColumn<Organization>[]>(() => [
  {
    accessorKey: "name",
    header: t("common.name"),
  },
  {
    accessorKey: "slug",
    header: t("admin.slug"),
  },
  {
    accessorKey: "createdAt",
    header: t("common.created"),
  },
  {
    accessorKey: "actions",
    header: t("common.actions"),
  },
]);
</script>

<template>
  <UDashboardPanel id="organizations">
    <template #header>
      <UDashboardNavbar :title="t('admin.organizations')">
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
            :model-value="table?.tableApi?.getColumn('name')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="t('admin.filterOrganizations')"
            @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton :to="`/admin/orgs/create`" :label="t('admin.addOrganization')">
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
            v-model:column-filters="columnFilters"
            v-model:column-visibility="columnVisibility"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            :pagination-options="{
              getPaginationRowModel: getPaginationRowModel(),
            }"
            :data="organizations"
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
              <span class="font-medium">{{ row.getValue("name") }}</span>
            </template>

            <template #slug-cell="{ row }">
              <span class="font-mono text-sm">{{ row.getValue("slug") }}</span>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-muted-foreground text-sm">
                {{ new Date(row.getValue("createdAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <!-- View Details -->
                <UButton
                  :to="`/admin/orgs/${row.original.id}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  :title="t('common.viewDetails')"
                />

                <!-- Manage Members -->
                <UButton
                  :to="`/admin/orgs/${row.original.id}/members`"
                  variant="ghost"
                  icon="i-lucide-users"
                  :title="t('admin.manageMembers')"
                />

                <!-- Security Settings -->
                <UButton
                  :to="`/admin/orgs/${row.original.id}/security`"
                  variant="ghost"
                  icon="i-lucide-shield"
                  :title="t('admin.securitySettings')"
                />

                <!-- Delete (Keep as Modal for dangerous action) -->
                <DashboardOrgDeleteModal :organization="row.original" @refresh="fetchOrganizations">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    :title="t('admin.deleteOrganization')"
                  />
                </DashboardOrgDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div class="text-muted-foreground text-sm">
            Showing {{ organizations.length }} of {{ total }} organizations
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :default-page="(table?.tableApi?.getState().pagination.pageIndex ?? 0) + 1"
              :items-per-page="table?.tableApi?.getState().pagination.pageSize"
              :total="total"
              @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
