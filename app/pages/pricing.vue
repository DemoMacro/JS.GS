<script setup lang="ts">
import type { PricingTableSection, PricingTableTier } from "@nuxt/ui";

definePageMeta({
  layout: "app",
  title: "Pricing - JS.GS",
  description: "Simple, transparent pricing for individuals and teams.",
});

const tiers: PricingTableTier[] = [
  {
    id: "free",
    title: "Free",
    description: "For individuals and small teams.",
    price: "Free",
    button: {
      label: "Get Started",
      to: "/auth/sign-up",
      color: "primary",
    },
  },
  {
    id: "pro",
    title: "Pro",
    description: "For growing teams and businesses.",
    price: "Coming Soon",
    button: {
      label: "View on GitHub",
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
    title: "Self-Hosted",
    description: "Complete control, unlimited scale.",
    price: "Open Source",
    button: {
      label: "View on GitHub",
      to: "https://github.com/DemoMacro/JS.GS",
      target: "_blank",
      icon: "i-simple-icons-github",
      color: "neutral",
    },
  },
];

const sections: PricingTableSection[] = [
  {
    title: "Core Features",
    features: [
      {
        title: "All link features",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "All analytics features",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "QR code generation",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "Custom domains",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "Geographic analytics",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "UTM tracking",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "Link expiration",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
    ],
  },
  {
    title: "Team Features",
    features: [
      {
        title: "Organizations",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "Role-based access control",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "API access",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
    ],
  },
  {
    title: "Infrastructure",
    features: [
      {
        title: "Cloud hosting",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": false,
        },
      },
      {
        title: "Self-hosted deployment",
        tiers: {
          free: false,
          pro: false,
          "self-hosted": true,
        },
      },
    ],
  },
  {
    title: "Usage Limits",
    features: [
      {
        title: "Monthly link clicks",
        tiers: {
          free: "Unlimited (temporarily)",
          pro: "Unlimited (temporarily)",
          "self-hosted": "Unlimited",
        },
      },
      {
        title: "Team members",
        tiers: {
          free: "Unlimited (temporarily)",
          pro: "Unlimited (temporarily)",
          "self-hosted": "Unlimited",
        },
      },
      {
        title: "Organizations",
        tiers: {
          free: "Unlimited (temporarily)",
          pro: "Unlimited (temporarily)",
          "self-hosted": "Unlimited",
        },
      },
      {
        title: "API requests per month",
        tiers: {
          free: "Unlimited (temporarily)",
          pro: "Unlimited (temporarily)",
          "self-hosted": "Unlimited",
        },
      },
    ],
  },
  {
    title: "Support & Source",
    features: [
      {
        title: "Community support",
        tiers: {
          free: true,
          pro: true,
          "self-hosted": true,
        },
      },
      {
        title: "Source code access",
        tiers: {
          free: "Open Source",
          pro: "Open Source",
          "self-hosted": "Open Source",
        },
      },
      {
        title: "Self-hosting documentation",
        tiers: {
          free: false,
          pro: true,
          "self-hosted": true,
        },
      },
    ],
  },
];

const faqs = [
  {
    title: "What's the difference between plans?",
    description:
      "All plans have the same features. Free and Pro are cloud-hosted, Self-Hosted gives you complete control.",
  },
  {
    title: "Is JS.GS really open source?",
    description:
      "Yes! JS.GS is 100% open source. All features are available in the self-hosted version completely free.",
  },
  {
    title: "Why would I pay for the cloud version?",
    description:
      "We handle hosting, maintenance, and scaling. You get the same features without managing infrastructure.",
  },
  {
    title: "Why choose Self-Hosted over cloud?",
    description:
      "Complete control over your data and infrastructure. Perfect for strict data sovereignty requirements.",
  },
  {
    title: "How do I get started with Self-Hosted?",
    description: "Check out our GitHub repository for deployment instructions and documentation.",
  },
  {
    title: "Where can I report bugs or request features?",
    description:
      "Feel free to open issues on our GitHub repository. We welcome bug reports and feature suggestions!",
  },
];
</script>

<template>
  <div>
    <UPageHero
      title="Simple, Transparent Pricing"
      description="Choose the plan that's right for you. All plans include our core link shortening features."
    />

    <UContainer>
      <!-- Pricing Table -->
      <div class="mb-16">
        <UPricingTable :tiers="tiers" :sections="sections" />
      </div>

      <!-- FAQ Section -->
      <div class="mb-16">
        <div class="mb-8 text-center">
          <h2 class="mb-2 text-2xl font-bold">Frequently Asked Questions</h2>
          <p class="text-muted-foreground">
            Find answers to common questions about our pricing and plans.
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
        title="Ready to Get Started?"
        description="Join our community on GitHub and start shortening links today."
        :links="[
          {
            label: 'View on GitHub',
            to: 'https://github.com/DemoMacro/JS.GS',
            icon: 'i-simple-icons-github',
            target: '_blank',
            color: 'neutral',
          },
          {
            label: 'Star on GitHub',
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
