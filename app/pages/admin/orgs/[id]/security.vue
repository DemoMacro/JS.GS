<script setup lang="ts">
definePageMeta({
  title: "Organization Security - Admin - JS.GS",
});

const route = useRoute();
const orgId = route.params.id as string;

// Use composable for organization data
const { organization, loading } = useOrg(orgId);
</script>

<template>
  <div v-if="loading" class="flex h-64 items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
  </div>

  <div v-else-if="!organization" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">Organization not found</h3>
    <p class="text-muted-foreground mb-4">
      The organization you're looking for doesn't exist or you don't have permission to view it.
    </p>
    <UButton to="/admin/orgs">Back to Organizations</UButton>
  </div>

  <div v-else>
    <DashboardOrgSecuritySettings :organization="organization" />
  </div>
</template>
