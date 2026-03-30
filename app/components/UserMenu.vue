<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

defineProps<{
  collapsed?: boolean;
}>();

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Check if user has admin role
const isAdmin = computed(() => {
  return session.value?.user?.role === "admin";
});

// Get current route
const route = useRoute();

// Check if currently in admin section
const isInAdmin = computed(() => {
  return route.path.startsWith("/admin");
});

// Navigation functionality
async function navigateToDashboard() {
  await navigateTo("/dashboard");
}

async function navigateToAdmin() {
  await navigateTo("/admin");
}

// Sign out functionality
async function handleSignOut() {
  try {
    const { error } = await authClient.signOut();

    if (error) {
      toast.add({
        title: t("common.signOutError"),
        description: error.message || t("common.failedToSignOut"),
        color: "error",
      });
      return;
    }

    // Refresh session after successful sign out
    await authClient.getSession();

    toast.add({
      title: t("common.signedOut"),
      description: t("common.signedOutDesc"),
      color: "success",
    });

    await navigateTo("/");
  } catch (error) {
    toast.add({
      title: t("common.signOutError"),
      description: t("common.signOutErrorDesc"),
      color: "error",
    });
  }
}

const items = computed<DropdownMenuItem[][]>(() => {
  return [
    [
      {
        type: "label",
        label: session.value?.user?.name || session.value?.user?.email,
        avatar: {
          src: session.value?.user.image || undefined,
          alt: session.value?.user?.name || session.value?.user?.email,
        },
      },
    ],
    [
      {
        label: isInAdmin.value ? t("common.goToDashboard") : t("dashboard.title"),
        icon: "i-lucide-layout-dashboard",
        onSelect: navigateToDashboard,
      },
      ...(isAdmin.value
        ? [
            {
              label: t("admin.title"),
              icon: "i-lucide-shield",
              onSelect: navigateToAdmin,
            },
          ]
        : []),
      {
        label: t("dashboard.profile"),
        icon: "i-lucide-user",
        onSelect: () => navigateTo("/dashboard/settings"),
      },
      {
        label: t("common.security"),
        icon: "i-lucide-shield",
        onSelect: () => navigateTo("/dashboard/settings/security"),
      },
      {
        label: t("dashboard.invitations"),
        icon: "i-lucide-mail",
        onSelect: () => navigateTo("/dashboard/settings/invitations"),
      },
      {
        label: t("dashboard.apiKeys"),
        icon: "i-lucide-key",
        onSelect: () => navigateTo("/dashboard/apikeys"),
      },
    ],
    [
      {
        label: t("common.signOut"),
        icon: "i-lucide-log-out",
        color: "error",
        onSelect: handleSignOut,
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
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-bind="{
        ...session?.user,
        label: collapsed ? undefined : session?.user?.name || session?.user?.email,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
      :avatar="{
        src: session?.user?.image || undefined,
        alt: session?.user?.name || session?.user?.email,
      }"
    />
  </UDropdownMenu>
</template>
