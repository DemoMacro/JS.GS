<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { UserWithRole } from "better-auth/plugins";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

// Table state
const table = useTemplateRef("table");
const columnFilters = ref([
  {
    id: "email",
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

// Fetch users using useAsyncData with SSR support
const {
  data: usersData,
  pending: loading,
  refresh: fetchUsers,
  error,
} = await useAsyncData(
  "admin-users",
  async () => {
    const result = await authClient.admin.listUsers({
      query: {
        limit: pagination.value.pageSize,
        offset: pagination.value.pageIndex * pagination.value.pageSize,
        searchValue: searchValue.value || undefined,
        sortBy: "role",
      },
    });
    return result.data;
  },
  {
    transform: (data) => ({
      users: data?.users ?? [],
      total: data?.total ?? 0,
    }),
    watch: [() => pagination.value.pageIndex, () => pagination.value.pageSize, searchValue],
  },
);

const users = computed(() => usersData.value?.users ?? []);
const total = computed(() => usersData.value?.total ?? 0);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: t("common.error"),
      description: t("common.unexpectedError"),
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
const columns = computed<TableColumn<UserWithRole>[]>(() => [
  {
    accessorKey: "email",
    header: t("common.email"),
  },
  {
    accessorKey: "name",
    header: t("common.name"),
  },
  {
    accessorKey: "image",
    header: t("admin.avatar"),
  },
  {
    accessorKey: "emailVerified",
    header: t("common.verified"),
  },
  {
    accessorKey: "role",
    header: t("common.role"),
  },
  {
    accessorKey: "banned",
    header: t("common.status"),
  },
  {
    accessorKey: "createdAt",
    header: t("common.created"),
  },
  {
    accessorKey: "updatedAt",
    header: t("common.updated"),
  },
  {
    accessorKey: "actions",
    header: t("common.actions"),
  },
]);
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar :title="t('admin.users')">
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
            :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="t('admin.filterEmails')"
            @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton :to="`/admin/users/create`" :label="t('admin.addUser')">
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
            :data="users"
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
            <template #email-cell="{ row }">
              <span class="font-medium">{{ row.getValue("email") }}</span>
            </template>

            <template #name-cell="{ row }">
              <span>{{ row.getValue("name") || "—" }}</span>
            </template>

            <template #image-cell="{ row }">
              <UAvatar
                v-if="row.getValue('image')"
                :src="row.getValue('image')"
                :alt="row.getValue('name')"
                size="sm"
              />
              <div
                v-else
                class="bg-primary/10 flex size-8 items-center justify-center rounded-full"
              >
                <UIcon name="i-lucide-user" class="text-primary size-4" />
              </div>
            </template>

            <template #emailVerified-cell="{ row }">
              <UBadge
                :color="row.getValue('emailVerified') ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ row.getValue("emailVerified") ? t("common.verified") : t("common.notVerified") }}
              </UBadge>
            </template>

            <template #role-cell="{ row }">
              <UBadge
                :color="row.getValue('role') === 'admin' ? 'primary' : 'neutral'"
                variant="soft"
              >
                {{ row.getValue("role") || t("common.user") }}
              </UBadge>
            </template>

            <template #banned-cell="{ row }">
              <div v-if="row.getValue('banned')" class="space-y-1">
                <UBadge color="error" variant="soft" size="sm"> {{ t("common.banned") }} </UBadge>
                <div v-if="row.getValue('banReason')" class="text-muted-foreground text-xs">
                  {{ row.getValue("banReason") }}
                </div>
                <div v-if="row.getValue('banExpires')" class="text-muted-foreground text-xs">
                  Expires:
                  {{ new Date(row.getValue("banExpires")).toLocaleDateString() }}
                </div>
              </div>
              <UBadge v-else color="success" variant="soft" size="sm">
                {{ t("common.active") }}
              </UBadge>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-muted-foreground text-sm">
                {{ new Date(row.getValue("createdAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #updatedAt-cell="{ row }">
              <span class="text-muted-foreground text-sm">
                {{ new Date(row.getValue("updatedAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <!-- View Details -->
                <UButton
                  :to="`/admin/users/${row.original.id}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  :title="t('common.viewDetails')"
                />

                <!-- Security Settings -->
                <UButton
                  :to="`/admin/users/${row.original.id}/security`"
                  variant="ghost"
                  icon="i-lucide-shield"
                  :title="t('admin.securitySettings')"
                />

                <!-- Delete (Keep as Modal for dangerous action) -->
                <DashboardUserDeleteModal :user="row.original" @refresh="fetchUsers">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    :title="t('admin.deleteUser')"
                  />
                </DashboardUserDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div class="text-muted-foreground text-sm">
            Showing {{ users.length }} of {{ total }} users
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
