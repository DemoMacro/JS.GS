<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

import { authClient } from "~/utils/auth";

const { t, locale, setLocale } = useI18n();

const flags: Record<string, string> = { en: "🇺🇸", zh_cn: "🇨🇳" };

function toggleLocale() {
  setLocale(locale.value === "en" ? "zh_cn" : "en");
}

const route = useRoute();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Define navigation menu items
const items = computed<NavigationMenuItem[]>(() => {
  const baseItems: NavigationMenuItem[] = [
    {
      label: t("common.home"),
      to: "/",
      active: route.path === "/",
      icon: "i-lucide-house",
    },
    {
      label: t("common.pricing"),
      to: "/pricing",
      active: route.path === "/pricing",
      icon: "i-lucide-tag",
    },
    {
      label: t("common.apiReference"),
      to: "/api/reference",
      active: route.path === "/api/reference",
      icon: "i-lucide-code",
      target: "_blank",
    },
  ];

  return baseItems;
});

// Footer navigation items
const footerItems = computed<NavigationMenuItem[]>(() => [
  { label: t("auth.privacyPolicy"), to: "/privacy" },
  { label: t("auth.termsOfService"), to: "/terms" },
]);
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="flex items-center gap-1.5 text-lg font-semibold"> JS.GS </NuxtLink>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <template v-if="session?.user">
          <div class="max-w-48">
            <UserMenu />
          </div>
        </template>

        <template v-else>
          <UButton to="/auth/sign-in" :label="t('common.signIn')" color="neutral" variant="ghost" />
          <UButton to="/auth/sign-up" :label="t('common.signUp')" color="neutral" />
        </template>

        <UButton
          :label="flags[locale]"
          color="neutral"
          variant="ghost"
          class="text-base"
          @click="toggleLocale"
        />
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-muted-foreground text-sm">JS.GS • {{ new Date().getFullYear() }}</p>
      </template>

      <UNavigationMenu :items="footerItems" variant="link" />

      <template #right>
        <UButton
          to="https://github.com/DemoMacro/JS.GS"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>
