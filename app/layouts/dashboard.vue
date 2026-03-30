<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

const route = useRoute();
const toast = useToast();

const open = ref(false);

const isAdmin = computed(() => route.path.startsWith("/admin"));

const adminLinks = computed(() => [
  {
    label: t("admin.title"),
    icon: "i-lucide-house",
    to: "/admin",
    onSelect: () => {
      open.value = false;
    },
    exact: true,
  },
  {
    label: t("admin.users"),
    icon: "i-lucide-users",
    to: "/admin/users",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: t("admin.organizations"),
    icon: "i-lucide-building",
    to: "/admin/orgs",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: t("admin.sessions"),
    icon: "i-lucide-activity",
    to: "/admin/sessions",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: t("admin.links"),
    icon: "i-lucide-link",
    to: "/admin/links",
    onSelect: () => {
      open.value = false;
    },
  },
]);

const dashboardLinks = computed(() => [
  {
    label: t("dashboard.title"),
    icon: "i-lucide-house",
    to: "/dashboard",
    onSelect: () => {
      open.value = false;
    },
    exact: true,
  },
  {
    label: t("admin.links"),
    icon: "i-lucide-link",
    to: "/dashboard/links",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: t("dashboard.domains"),
    icon: "i-lucide-globe",
    to: "/dashboard/domains",
    onSelect: () => {
      open.value = false;
    },
  },
]);

// Get active organization to conditionally show Organization link
const activeOrgResult = authClient.useActiveOrganization();
const hasActiveOrg = computed(() => !!activeOrgResult.value.data);

// Add Organization link if there's an active organization
const organizationLink = computed(() => ({
  label: t("dashboard.org"),
  icon: "i-lucide-building",
  to: "/dashboard/org",
  onSelect: () => {
    open.value = false;
  },
}));

const links = computed(() => {
  const mainLinks = isAdmin.value ? adminLinks.value : dashboardLinks.value;

  // Add Organization link to dashboard if there's an active organization
  const finalMainLinks = isAdmin.value
    ? mainLinks
    : [...mainLinks, ...(hasActiveOrg.value ? [organizationLink.value] : [])];

  return [
    finalMainLinks,
    [
      {
        label: t("common.feedback"),
        icon: "i-lucide-message-circle",
        to: "https://github.com/DemoMacro/JS.GS/issues",
        target: "_blank",
      },
      {
        label: t("common.helpAndSupport"),
        icon: "i-lucide-info",
        to: "https://github.com/DemoMacro/JS.GS",
        target: "_blank",
      },
    ],
  ] satisfies NavigationMenuItem[][];
});

const { locale, locales, setLocale } = useI18n();

const flags: Record<string, string> = { en: "🇺🇸", zh_cn: "🇨🇳" };

const groups = computed(() => [
  {
    id: "links",
    label: t("common.goTo"),
    items: links.value.flat(),
  },
  {
    id: "code",
    label: t("common.code"),
    items: [
      {
        id: "source",
        label: t("common.viewPageSource"),
        icon: "i-simple-icons-github",
        to: `https://github.com/DemoMacro/JS.GS/blob/main/app/pages${route.path === "/" ? "/index" : route.path}.vue`,
        target: "_blank",
      },
    ],
  },
  {
    id: "locale",
    label: t("common.language"),
    items: locales.value.map((l) => ({
      id: l.code,
      label: `${flags[l.code] || ""} ${l.name}`,
      active: l.code === locale.value,
      onSelect: () => {
        if (l.code !== locale.value) {
          setLocale(l.code);
        }
      },
    })),
  },
]);

onMounted(async () => {
  const cookie = useCookie("cookie-consent", {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
  });
  if (cookie.value === "accepted") {
    return;
  }

  toast.add({
    title: t("common.cookieConsent"),
    duration: 0,
    close: false,
    actions: [
      {
        label: t("common.accept"),
        color: "neutral",
        variant: "outline",
        onClick: () => {
          cookie.value = "accepted";
        },
      },
      {
        label: t("common.optOut"),
        color: "neutral",
        variant: "ghost",
      },
    ],
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <OrgsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="ring-default bg-transparent" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
