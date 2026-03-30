<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Organization } from "better-auth/plugins";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

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
    label: t("common.selectOrganization"),
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
        title: t("common.failedToSwitchOrg"),
        description: error.message || t("common.failedToSwitchOrg"),
        color: "error",
      });
      return;
    }

    const orgList = orgs.value;
    const org = orgList?.find((o: Organization) => o.id === entityId);
    const isPersonal = org?.slug?.startsWith("user_");
    toast.add({
      title: isPersonal ? t("common.personalWorkspace") : t("common.switchedToOrg"),
      description: isPersonal
        ? t("common.inPersonalWorkspace")
        : t("common.nowInOrg", { name: org?.name || "..." }),
      color: "success",
    });

    // useActiveOrganization hook will auto-update
    // useAsyncData with watch will auto-refetch organizations
  } catch (error) {
    toast.add({
      title: t("common.failedToSwitchOrg"),
      description: error instanceof Error ? error.message : t("common.unexpectedError"),
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
    // Personal organization
    ...(personalOrg
      ? [
          {
            label: personalOrg.name,
            icon: "i-lucide-user",
            id: personalOrg.id,
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
        label: t("dashboard.createOrg"),
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
