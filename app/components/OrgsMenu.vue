<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Organization } from "better-auth/plugins";

import { authClient } from "~/utils/auth";

defineProps<{
  collapsed?: boolean;
}>();

const toast = useToast();

// Get current session to track user changes
const { data: session } = await authClient.useSession(useFetch);

// Key for cache busting when session changes
const sessionKey = computed(() => session.value?.user?.id || "anonymous");

// Fetch organizations with reactive refetch
const { data: orgs } = await useAsyncData(
  "organizations",
  async () => {
    const result = await authClient.organization.list();
    return result.data;
  },
  {
    watch: [sessionKey], // Refetch when user changes
  },
);

// Use reactive hook for active organization - this will auto-update
const activeOrgResult = authClient.useActiveOrganization();

// Loading state for switching
const switching = ref(false);

// Current active entity (personal or organization)
const currentEntity = computed(() => {
  const activeOrg = activeOrgResult.value.data;
  if (activeOrg) {
    const isPersonal = activeOrg.slug?.startsWith("user_");
    return {
      label: activeOrg.name,
      icon: isPersonal ? "i-lucide-user" : "i-lucide-building",
      type: isPersonal ? "personal" : "organization",
    };
  }
  return {
    label: "Select Organization",
    icon: "i-lucide-users",
    type: "none",
  };
});

// Switch between organizations
async function switchContext(entityId: string) {
  if (switching.value) return;

  switching.value = true;
  try {
    // Switch to organization mode
    const { error } = await authClient.organization.setActive({
      organizationId: entityId,
    });

    if (error) {
      toast.add({
        title: "Switch Failed",
        description: error.message || "Failed to switch to organization",
        color: "error",
      });
      return;
    }

    const orgList = orgs.value;
    const org = orgList?.find((o: Organization) => o.id === entityId);
    const isPersonal = org?.slug?.startsWith("user_");
    toast.add({
      title: isPersonal ? "Personal Workspace" : "Switched to Organization",
      description: isPersonal
        ? "You are now in your personal workspace"
        : `You are now working in ${org?.name || "the organization"}`,
      color: "success",
    });

    // useActiveOrganization hook will auto-update
    // useAsyncData with watch will auto-refetch organizations
  } catch (error) {
    toast.add({
      title: "Switch Failed",
      description: error instanceof Error ? error.message : "An error occurred",
      color: "error",
    });
  } finally {
    switching.value = false;
  }
}

// Build dropdown menu items
const items = computed<DropdownMenuItem[][]>(() => {
  const orgList = orgs.value;

  // Separate personal and team organizations
  const personalOrg = orgList?.find((org: Organization) => org.slug?.startsWith("user_"));
  const teamOrgs = orgList?.filter((org: Organization) => !org.slug?.startsWith("user_")) || [];

  const organizationOptions = [
    // Personal organization at top
    ...(personalOrg
      ? [
          {
            label: personalOrg.name,
            icon: "i-lucide-user",
            id: personalOrg.id,
            badge: "Personal",
            onSelect: () => switchContext(personalOrg.id),
          },
        ]
      : []),
    // Team organizations
    ...teamOrgs.map((org: Organization) => ({
      label: org.name,
      icon: "i-lucide-building",
      id: org.id,
      onSelect: () => switchContext(org.id),
    })),
  ];

  return [
    organizationOptions,
    [
      {
        label: "Create organization",
        icon: "i-lucide-circle-plus",
        onSelect: () => navigateTo("/dashboard/create-org"),
      },
    ],
  ];
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      :label="collapsed ? undefined : currentEntity.label"
      :icon="collapsed ? currentEntity.icon : undefined"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      :loading="switching"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    >
      <template v-if="!collapsed" #leading>
        <UIcon :name="currentEntity.icon" class="text-dimmed" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>
