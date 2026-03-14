<script setup lang="ts">
definePageMeta({
  title: "Organization Security - Dashboard - JS.GS",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const loading = ref(false);
const error = ref<string | null>(null);

// Fetch organization details
async function fetchOrganization() {
  if (!activeOrg.value?.id) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const orgId = activeOrg.value?.id;
    if (!orgId) {
      error.value = "No active organization found";
      return;
    }

    const { data, error: err } = await authClient.organization.getFullOrganization({
      query: { organizationId: orgId },
    });

    if (err) {
      error.value = err.message || "Failed to fetch organization";
      return;
    }

    // The reactive hook will update automatically when the cache refreshes
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch organization";
  } finally {
    loading.value = false;
  }
}

// Handle refresh event from child components
function handleRefresh() {
  // Refresh organizations list in OrgsMenu
  refreshNuxtData("organizations");
}

// Load organization on mount
onMounted(() => {
  fetchOrganization();
});
</script>

<template>
  <div v-if="loading && !activeOrg" class="flex h-64 items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
  </div>

  <div v-else-if="error && !activeOrg" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">Error</h3>
    <p class="text-muted-foreground mb-4">{{ error }}</p>
    <UButton @click="fetchOrganization">Retry</UButton>
  </div>

  <div v-else-if="!activeOrg" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">No Active Organization</h3>
    <p class="text-muted-foreground mb-4">
      Please select an organization from the menu or create a new one.
    </p>
    <UButton to="/dashboard/create-org">Create Organization</UButton>
  </div>

  <div v-else class="space-y-6">
    <DashboardOrgSecuritySettings :organization="activeOrg" @refresh="handleRefresh" />
  </div>
</template>
