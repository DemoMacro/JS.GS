<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();
const { copy, copied } = useClipboard();

const schema = z.object({
  name: z.string().min(1, t("dashboard.apiKeyNameDesc")),
  expiresIn: z.number().min(3600, t("dashboard.1hour")).max(31536000, t("dashboard.1year")),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: "",
  expiresIn: 60 * 60 * 24 * 30, // 30 days default
});

const submitting = ref(false);
const createdKey = ref<{ key: string; name: string } | null>(null);

async function createApiKey(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.apiKey.create({
      name: event.data.name,
      expiresIn: event.data.expiresIn,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("dashboard.failedToCreateApiKey"),
        color: "error",
      });
      return;
    }

    // Show the API key for copying
    createdKey.value = {
      key: result.data.key,
      name: event.data.name,
    };

    toast.add({
      title: t("common.success"),
      description: t("dashboard.apiKeyCreatedSuccess", { name: event.data.name }),
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("common.unexpectedError"),
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

function goToKeys() {
  createdKey.value = null;
  state.name = "";
  navigateTo("/dashboard/apikeys");
}

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: t("common.success"),
      description: t("dashboard.apiKeyCopied"),
      color: "success",
    });
  }
});

// Expiration options
const expirationItems = computed(() => [
  { label: t("dashboard.1hour"), value: 3600 },
  { label: t("dashboard.1day"), value: 86400 },
  { label: t("dashboard.7days"), value: 604800 },
  { label: t("dashboard.30days"), value: 2592000 },
  { label: t("dashboard.90days"), value: 7776000 },
  { label: t("dashboard.1year"), value: 31536000 },
]);
</script>

<template>
  <UDashboardPanel id="create-api-key">
    <template #header>
      <UDashboardNavbar :title="t('dashboard.createApiKey')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full lg:max-w-2xl">
        <!-- Show API Key after successful creation -->
        <div v-if="createdKey" class="space-y-4">
          <UPageCard
            :title="t('dashboard.apiKeyCreatedTitle')"
            :description="t('dashboard.apiKeyCreatedDesc')"
            variant="subtle"
          >
            <div class="space-y-4">
              <div>
                <label class="mb-2 block text-sm font-medium">{{
                  t("dashboard.yourApiKey")
                }}</label>
                <div class="flex gap-2">
                  <UInput
                    :value="createdKey.key"
                    readonly
                    class="flex-1 font-mono text-sm"
                    color="neutral"
                  />
                  <UButton
                    icon="i-lucide-copy"
                    :color="copied ? 'success' : 'neutral'"
                    variant="outline"
                    @click="copy(createdKey.key)"
                  >
                    {{ copied ? t("common.copied") : t("common.copy") }}
                  </UButton>
                </div>
              </div>

              <UAlert
                icon="i-lucide-alert-triangle"
                color="warning"
                :title="t('dashboard.saveApiKeySecurely')"
                :description="t('dashboard.saveApiKeyWarning')"
              />

              <div class="flex gap-3 pt-4">
                <UButton
                  variant="outline"
                  @click="
                    createdKey = null;
                    state.name = '';
                  "
                >
                  {{ t("dashboard.createAnother") }}
                </UButton>
                <UButton @click="goToKeys"> {{ t("dashboard.goToApiKeys") }} </UButton>
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Creation form -->
        <UForm v-else id="create-api-key" :schema="schema" :state="state" @submit="createApiKey">
          <UPageCard
            :title="t('dashboard.createApiKey')"
            :description="t('dashboard.apiKeyExpirationDesc')"
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="ms-auto flex gap-3">
              <UButton variant="outline" to="/dashboard/apikeys" :disabled="submitting">
                {{ t("common.cancel") }}
              </UButton>
              <UButton
                :label="t('dashboard.createApiKey')"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="name"
              :label="t('common.name')"
              :description="t('dashboard.apiKeyNameDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                v-model="state.name"
                :placeholder="t('dashboard.apiKeyNamePlaceholder')"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <UFormField
              name="expiresIn"
              :label="t('dashboard.apiKeyExpiration')"
              :description="t('dashboard.apiKeyExpirationDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <USelect
                v-model="state.expiresIn"
                :items="expirationItems"
                :disabled="submitting"
                class="w-full sm:max-w-xs"
              />
            </UFormField>

            <USeparator />

            <div>
              <h4 class="mb-2 font-medium">{{ t("dashboard.importantNotes") }}</h4>
              <ul class="text-muted-foreground space-y-1 text-sm">
                <li>{{ t("dashboard.apiKeyNote1") }}</li>
                <li>{{ t("dashboard.apiKeyNote2") }}</li>
                <li>{{ t("dashboard.apiKeyNote3") }}</li>
                <li>{{ t("dashboard.apiKeyNote4") }}</li>
              </ul>
            </div>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
