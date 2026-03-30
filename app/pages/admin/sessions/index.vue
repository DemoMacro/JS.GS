<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

// Table state
const table = useTemplateRef("table");
const columnFilters = ref([
  {
    id: "userEmail",
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

// Use composable for session data with reactive search
const { sessions, loading, fetchSessions, revokeUserSessions } = useSessions(searchValue);

const total = computed(() => sessions.value.length);

// Watch for search changes - sync search input with searchValue
watch(
  () => columnFilters.value[0]?.value,
  (newValue) => {
    searchValue.value = newValue || "";
  },
);

// Table columns
const columns = computed<TableColumn<any>[]>(() => [
  {
    accessorKey: "userEmail",
    header: t("common.user"),
  },
  {
    accessorKey: "role",
    header: t("common.role"),
  },
  {
    accessorKey: "token",
    header: t("admin.token"),
  },
  {
    accessorKey: "ipAddress",
    header: t("admin.ipAddress"),
  },
  {
    accessorKey: "userAgent",
    header: t("admin.userAgent"),
  },
  {
    accessorKey: "createdAt",
    header: t("common.created"),
  },
  {
    accessorKey: "expiresAt",
    header: t("common.expires"),
  },
  {
    accessorKey: "actions",
    header: t("common.actions"),
  },
]);

// Get session status
function getSessionStatus(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  return expiry > now ? "active" : "expired";
}

// Handle session revocation
async function handleRevokeSession(session: any) {
  try {
    await revokeUserSessions(session.userId);

    toast.add({
      title: t("common.success"),
      description: t("admin.sessionsRevoked"),
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: t("common.error"),
      description: err instanceof Error ? err.message : t("admin.failedToRevokeSessions"),
      color: "error",
    });
  }
}
</script>

<template>
  <UDashboardPanel id="sessions">
    <template #header>
      <UDashboardNavbar :title="t('admin.sessions')">
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
            :model-value="table?.tableApi?.getColumn('userEmail')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="t('admin.filterUsers')"
            @update:model-value="table?.tableApi?.getColumn('userEmail')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
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
            :data="sessions"
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
            <template #userEmail-cell="{ row }">
              <div class="flex items-center gap-2">
                <div class="bg-primary/10 flex size-6 items-center justify-center rounded-full">
                  <UIcon name="i-lucide-user" class="text-primary size-3" />
                </div>
                <div>
                  <div class="font-medium">{{ row.getValue("userEmail") }}</div>
                  <div class="text-muted-foreground text-xs">
                    {{ row.original.userName || "—" }}
                  </div>
                </div>
              </div>
            </template>

            <template #role-cell="{ row }">
              <UBadge
                :color="row.getValue('role') === 'admin' ? 'primary' : 'neutral'"
                variant="soft"
              >
                {{ row.getValue("role") || "—" }}
              </UBadge>
            </template>

            <template #token-cell="{ row }">
              <code class="bg-muted rounded px-2 py-1 text-xs">
                {{ row.getValue("token") || "—" }}
              </code>
            </template>

            <template #ipAddress-cell="{ row }">
              <span class="text-muted-foreground font-mono text-sm">
                {{ row.getValue("ipAddress") || "—" }}
              </span>
            </template>

            <template #userAgent-cell="{ row }">
              <span class="text-muted-foreground block max-w-xs truncate text-sm">
                {{ row.getValue("userAgent") || "—" }}
              </span>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-muted-foreground text-sm">
                {{ new Date(row.getValue("createdAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #expiresAt-cell="{ row }">
              <span class="text-muted-foreground text-sm">
                {{ new Date(row.getValue("expiresAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <!-- View User Details -->
                <UButton
                  :to="`/admin/users/${row.original.userId}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  :title="t('admin.viewUser')"
                />

                <!-- Revoke User Sessions -->
                <UButton
                  variant="ghost"
                  icon="i-lucide-power"
                  color="error"
                  :title="t('admin.revokeAllUserSessions')"
                  :disabled="getSessionStatus(row.getValue('expiresAt')) === 'expired'"
                  @click="handleRevokeSession(row.original)"
                />
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div class="text-muted-foreground text-sm">
            Showing {{ sessions.length }} of {{ total }} sessions
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
