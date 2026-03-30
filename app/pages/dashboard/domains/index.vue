<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";
import type { Domain } from "~~/shared/types/domain";

import { useDomains } from "~/composables/useDomains";
import { useOrganizations } from "~/composables/useOrganizations";
import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
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

async function copyToClipboard(token: string) {
  try {
    await navigator.clipboard.writeText(token);
    toast.add({
      title: t("common.success"),
      description: t("dashboard.verificationTokenCopied"),
      color: "success",
    });
  } catch {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.failedToCopyToken"),
      color: "error",
    });
  }
}

// Build query based on pagination and active organization
const query = computed(() => {
  const q: Record<string, any> = {
    limit: pagination.value.pageSize,
    offset: pagination.value.pageIndex * pagination.value.pageSize,
  };

  // Use active organization for filtering
  if (activeOrg.value?.id) {
    q.organizationId = activeOrg.value.id;
  }

  return q;
});

// Fetch domains using composable with watch sources
const {
  domains,
  total,
  loading,
  refresh: fetchDomains,
  error,
} = useDomains(query.value, [
  activeOrg,
  () => pagination.value.pageIndex,
  () => pagination.value.pageSize,
]);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: t("common.error"),
      description: newError.message || "Failed to fetch domains",
      color: "error",
    });
  }
});

const columns: TableColumn<Domain>[] = [
  {
    accessorKey: "domainName",
    header: () => t("dashboard.domainName"),
  },
  {
    accessorKey: "status",
    header: () => t("common.status"),
  },
  {
    accessorKey: "verifiedAt",
    header: () => t("common.verified"),
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
  <UDashboardPanel id="domains">
    <template #header>
      <UDashboardNavbar :title="t('dashboard.domains')">
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
            :placeholder="t('dashboard.searchDomain')"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton to="/dashboard/domains/create" :label="t('dashboard.addDomain')">
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
            :data="domains"
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
            <template #domainName-cell="{ row }">
              <span class="font-mono text-sm">
                {{ row.getValue("domainName") }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="
                  row.getValue('status') === 'active'
                    ? 'success'
                    : row.getValue('status') === 'inactive'
                      ? 'error'
                      : 'neutral'
                "
                variant="subtle"
              >
                {{
                  row.getValue("status") === "active"
                    ? t("common.active")
                    : row.getValue("status") === "inactive"
                      ? t("common.inactive")
                      : t("common.pending")
                }}
              </UBadge>
            </template>

            <template #verifiedAt-cell="{ row }">
              <span class="text-sm">
                {{
                  (row.original as Domain).verifiedAt
                    ? new Date((row.original as Domain).verifiedAt as Date).toLocaleDateString()
                    : t("common.notVerified")
                }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  variant="ghost"
                  icon="i-lucide-copy"
                  :title="t('dashboard.copyVerificationToken')"
                  :disabled="!row.original.verificationToken"
                  @click="copyToClipboard((row.original as Domain).verificationToken || '')"
                />

                <UPopover v-if="row.original.verificationToken">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-info"
                    :title="t('dashboard.verificationInfo')"
                  />

                  <template #content>
                    <div class="max-w-sm p-4">
                      <p class="mb-2 text-sm font-medium">{{ t("dashboard.dnsVerification") }}</p>
                      <p class="text-muted-foreground mb-2 text-sm">
                        {{ t("dashboard.dnsRecordInstruction") }}
                      </p>
                      <div class="bg-muted space-y-1 rounded p-3">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium">Type:</span>
                          <UBadge variant="subtle">TXT</UBadge>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium">Host/Name:</span>
                          <span class="font-mono text-sm">@</span>
                          <span class="text-muted-foreground text-xs"
                            >(or {{ row.original.domainName }})</span
                          >
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium">Value:</span>
                          <span class="font-mono text-sm break-all">
                            {{ row.original.verificationToken }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </UPopover>

                <DashboardDomainVerifyModal
                  v-if="row.original.status === 'pending'"
                  :domain="row.original"
                  @refresh="fetchDomains"
                >
                  <UButton
                    variant="ghost"
                    icon="i-lucide-refresh-cw"
                    :title="t('dashboard.verifyDomain')"
                  />
                </DashboardDomainVerifyModal>

                <DashboardDomainDeleteModal :domain="row.original" @refresh="fetchDomains">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    :title="t('dashboard.deleteDomain')"
                  />
                </DashboardDomainDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="border-default mt-auto flex items-center justify-between gap-3 border-t pt-4">
          <div class="text-muted-foreground text-sm">
            Showing
            {{ table?.tableApi?.getFilteredRowModel().rows.length ?? 0 }} of {{ total }} domains
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
      </div>
    </template>
  </UDashboardPanel>
</template>
