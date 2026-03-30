<script setup lang="ts">
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "app",
});

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

const schema = z.object({
  originalUrl: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => val === "" || /^[a-zA-Z][a-zA-Z\d+-.]*:/.test(val),
      t("home.validUrlRequired"),
    ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  originalUrl: "",
});

const loading = ref(false);
const createdLink = ref<{ shortCode: string; originalUrl: string } | null>(null);

async function createShortLink() {
  loading.value = true;
  createdLink.value = null;

  try {
    const result = await authClient.link.create({
      originalUrl: state.originalUrl,
      title: null,
      description: null,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("home.failedToCreateLink"),
        color: "error",
      });
      return;
    }

    createdLink.value = {
      shortCode: result.data.shortCode,
      originalUrl: state.originalUrl!,
    };

    toast.add({
      title: t("common.success"),
      description: t("home.linkCreated"),
      color: "success",
    });

    state.originalUrl = "";
  } catch {
    toast.add({
      title: t("common.error"),
      description: t("common.unexpectedError"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

const shortUrl = computed(() => {
  if (!createdLink.value) return "";
  return `${window.location.origin}/s/${createdLink.value.shortCode}`;
});

async function copyToClipboard() {
  if (!shortUrl.value) return;

  try {
    await navigator.clipboard.writeText(shortUrl.value);
    toast.add({
      title: t("common.copied"),
      description: t("home.linkCopied"),
      color: "success",
    });
  } catch {
    toast.add({
      title: t("common.error"),
      description: t("home.failedToCopyLink"),
      color: "error",
    });
  }
}
</script>

<template>
  <div>
    <UPageHero :title="t('home.heroTitle')" :description="t('home.heroDescription')">
      <template #default>
        <UContainer class="max-w-3xl">
          <div class="flex flex-col items-center gap-8">
            <UForm :schema="schema" :state="state" class="w-full" @submit="createShortLink">
              <UFormField name="originalUrl">
                <UFieldGroup class="w-full">
                  <UInput
                    v-model="state.originalUrl"
                    size="lg"
                    :placeholder="t('home.urlPlaceholder')"
                    :disabled="loading"
                    class="flex-1"
                  />

                  <UButton
                    type="submit"
                    size="lg"
                    :loading="loading"
                    :disabled="!state.originalUrl || state.originalUrl.trim().length === 0"
                  >
                    {{ t("home.shorten") }}
                  </UButton>
                </UFieldGroup>
              </UFormField>
            </UForm>

            <UCard v-if="createdLink" class="w-full">
              <div class="space-y-6">
                <UFormField :label="t('home.yourShortLink')">
                  <div class="flex items-center gap-2">
                    <UInput
                      :model-value="shortUrl"
                      readonly
                      size="md"
                      color="neutral"
                      variant="outline"
                      class="flex-1"
                    />
                    <UButton icon="i-lucide-copy" size="md" @click="copyToClipboard">
                      {{ t("common.copy") }}
                    </UButton>
                  </div>
                </UFormField>

                <USeparator />

                <UFormField :label="t('home.originalUrl')">
                  <UInput
                    :model-value="createdLink.originalUrl"
                    readonly
                    size="md"
                    color="neutral"
                    variant="outline"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>
          </div>
        </UContainer>
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      :title="t('home.featuresTitle')"
      :description="t('home.featuresDescription')"
      :features="[
        {
          icon: 'i-lucide-link',
          title: t('home.featureLinkShorteningTitle'),
          description: t('home.featureLinkShortening'),
        },
        {
          icon: 'i-lucide-bar-chart-2',
          title: t('home.featureAnalyticsTitle'),
          description: t('home.featureAnalytics'),
        },
        {
          icon: 'i-lucide-clock',
          title: t('home.featureTimeSeriesTitle'),
          description: t('home.featureTimeSeries'),
        },
        {
          icon: 'i-lucide-globe',
          title: t('home.featureGeographicTitle'),
          description: t('home.featureGeographic'),
        },
        {
          icon: 'i-lucide-tag',
          title: t('home.featureUtmTitle'),
          description: t('home.featureUtm'),
        },
        {
          icon: 'i-lucide-qr-code',
          title: t('home.featureQrCodeTitle'),
          description: t('home.featureQrCode'),
        },
      ]"
    />

    <UPageSection>
      <UPageCTA
        :title="t('home.ctaTitle')"
        :description="t('home.ctaDescription')"
        :links="[
          {
            label: t('common.getStarted'),
            to: session?.user ? '/dashboard' : '/auth/sign-up',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'neutral',
          },
          {
            label: t('common.viewOnGithub'),
            to: 'https://github.com/DemoMacro/JS.GS',
            target: '_blank',
            icon: 'i-simple-icons-github',
            color: 'neutral',
            variant: 'outline',
          },
        ]"
      />
    </UPageSection>
  </div>
</template>
