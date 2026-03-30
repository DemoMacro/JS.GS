<script setup lang="ts">
import type { PricingTableSection, PricingTableTier } from "@nuxt/ui";

const { t } = useI18n();

definePageMeta({
  layout: "app",
});

const tiers: PricingTableTier[] = [
  {
    id: "free",
    title: t("pricing.free"),
    description: t("pricing.freeDesc"),
    price: t("pricing.free"),
    button: {
      label: t("common.getStarted"),
      to: "/auth/sign-up",
      color: "primary",
    },
  },
  {
    id: "pro",
    title: t("pricing.pro"),
    description: t("pricing.proDesc"),
    price: t("pricing.comingSoon"),
    button: {
      label: t("common.viewOnGithub"),
      to: "https://github.com/DemoMacro/JS.GS",
      target: "_blank",
      icon: "i-simple-icons-github",
      color: "neutral",
      variant: "outline",
    },
    highlight: true,
  },
  {
    id: "self-hosted",
    title: t("pricing.selfHosted"),
    description: t("pricing.selfHostedDesc"),
    price: t("pricing.openSource"),
    button: {
      label: t("common.viewOnGithub"),
      to: "https://github.com/DemoMacro/JS.GS",
      target: "_blank",
      icon: "i-simple-icons-github",
      color: "neutral",
    },
  },
];

const sections: PricingTableSection[] = [
  {
    title: t("pricing.coreFeatures"),
    features: [
      {
        title: t("pricing.allLinkFeatures"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      {
        title: t("pricing.allAnalyticsFeatures"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      {
        title: t("pricing.qrCodeGeneration"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      { title: t("pricing.customDomains"), tiers: { free: true, pro: true, "self-hosted": true } },
      {
        title: t("pricing.geographicAnalytics"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      { title: t("pricing.utmTracking"), tiers: { free: true, pro: true, "self-hosted": true } },
      { title: t("pricing.linkExpiration"), tiers: { free: true, pro: true, "self-hosted": true } },
    ],
  },
  {
    title: t("pricing.teamFeatures"),
    features: [
      {
        title: t("pricing.allLinkFeatures"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      {
        title: t("pricing.roleBasedAccess"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      { title: t("pricing.apiAccess"), tiers: { free: true, pro: true, "self-hosted": true } },
    ],
  },
  {
    title: t("pricing.infrastructure"),
    features: [
      { title: t("pricing.cloudHosting"), tiers: { free: true, pro: true, "self-hosted": false } },
      {
        title: t("pricing.selfHostedDeployment"),
        tiers: { free: false, pro: false, "self-hosted": true },
      },
    ],
  },
  {
    title: t("pricing.usageLimits"),
    features: [
      {
        title: t("pricing.monthlyLinkClicks"),
        tiers: {
          free: t("pricing.unlimitedTemporarily"),
          pro: t("pricing.unlimitedTemporarily"),
          "self-hosted": t("pricing.unlimited"),
        },
      },
      {
        title: t("pricing.teamMembers"),
        tiers: {
          free: t("pricing.unlimitedTemporarily"),
          pro: t("pricing.unlimitedTemporarily"),
          "self-hosted": t("pricing.unlimited"),
        },
      },
      {
        title: t("pricing.allLinkFeatures"),
        tiers: {
          free: t("pricing.unlimitedTemporarily"),
          pro: t("pricing.unlimitedTemporarily"),
          "self-hosted": t("pricing.unlimited"),
        },
      },
      {
        title: t("pricing.apiRequestsPerMonth"),
        tiers: {
          free: t("pricing.unlimitedTemporarily"),
          pro: t("pricing.unlimitedTemporarily"),
          "self-hosted": t("pricing.unlimited"),
        },
      },
    ],
  },
  {
    title: t("pricing.supportAndSource"),
    features: [
      {
        title: t("pricing.communitySupport"),
        tiers: { free: true, pro: true, "self-hosted": true },
      },
      {
        title: t("pricing.sourceCodeAccess"),
        tiers: {
          free: t("pricing.openSource"),
          pro: t("pricing.openSource"),
          "self-hosted": t("pricing.openSource"),
        },
      },
      {
        title: t("pricing.selfHostingDocs"),
        tiers: { free: false, pro: true, "self-hosted": true },
      },
    ],
  },
];

const faqs = [
  { title: t("pricing.faqDifference"), description: t("pricing.faqDifferenceDesc") },
  { title: t("pricing.faqOpenSource"), description: t("pricing.faqOpenSourceDesc") },
  { title: t("pricing.faqPayCloud"), description: t("pricing.faqPayCloudDesc") },
  { title: t("pricing.faqSelfHostedVsCloud"), description: t("pricing.faqSelfHostedVsCloudDesc") },
  { title: t("pricing.faqSelfHostedStart"), description: t("pricing.faqSelfHostedStartDesc") },
  { title: t("pricing.faqBugs"), description: t("pricing.faqBugsDesc") },
];
</script>

<template>
  <div>
    <UPageHero :title="t('pricing.title')" :description="t('pricing.description')" />

    <UContainer>
      <!-- Pricing Table -->
      <div class="mb-16">
        <UPricingTable :tiers="tiers" :sections="sections" />
      </div>

      <!-- FAQ Section -->
      <div class="mb-16">
        <div class="mb-8 text-center">
          <h2 class="mb-2 text-2xl font-bold">{{ t("pricing.faqTitle") }}</h2>
          <p class="text-muted-foreground">
            {{ t("pricing.faqDescription") }}
          </p>
        </div>
        <UPageGrid>
          <UPageCard
            v-for="(faq, index) in faqs"
            :key="index"
            :title="faq.title"
            :description="faq.description"
            variant="subtle"
          />
        </UPageGrid>
      </div>
    </UContainer>

    <!-- CTA Section -->
    <UPageSection>
      <UPageCTA
        :title="t('home.ctaTitle')"
        :description="t('pricing.ctaDescription')"
        :links="[
          {
            label: t('common.viewOnGithub'),
            to: 'https://github.com/DemoMacro/JS.GS',
            icon: 'i-simple-icons-github',
            target: '_blank',
            color: 'neutral',
          },
          {
            label: t('pricing.starOnGithub'),
            to: 'https://github.com/DemoMacro/JS.GS/issues',
            color: 'neutral',
            variant: 'outline',
            icon: 'i-lucide-star',
            target: '_blank',
          },
        ]"
      />
    </UPageSection>
  </div>
</template>
