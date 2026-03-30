<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const schema = z.object({
  domainName: z.string().min(1, t("dashboard.domainDesc")),
  organizationId: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  domainName: "",
  organizationId: "",
});

const submitting = ref(false);

async function createDomain(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.domain.create({
      domainName: event.data.domainName,
      organizationId: activeOrg.value?.id || null,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("dashboard.failedToCreateDomain"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.domainCreated"),
      color: "success",
    });

    await navigateTo("/dashboard/domains");
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("common.unexpectedError"),
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="create-domain">
    <template #header>
      <UDashboardNavbar :title="t('dashboard.createDomain')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <UForm id="create-domain" :schema="schema" :state="state" @submit="createDomain">
          <UPageCard
            :title="t('dashboard.addCustomDomain')"
            :description="t('dashboard.addCustomDomainDesc')"
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="ms-auto flex gap-3">
              <UButton variant="outline" to="/dashboard/domains" :disabled="submitting">
                {{ t("common.cancel") }}
              </UButton>
              <UButton
                form="create-domain"
                :label="t('dashboard.createDomain')"
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
              name="domainName"
              :label="t('dashboard.domainName')"
              :description="t('dashboard.domainDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                v-model="state.domainName"
                :placeholder="t('dashboard.domainPlaceholder')"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <UFormField
              name="organizationId"
              :label="t('dashboard.org')"
              :description="
                activeOrg
                  ? t('dashboard.creatingFor', { name: activeOrg.name })
                  : t('dashboard.selectOrgForDomain')
              "
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                :model-value="activeOrg?.name || t('dashboard.selectOrgForDomain')"
                disabled
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <p class="text-sm font-medium">{{ t("dashboard.dnsWarning") }}</p>
            <p class="text-muted-foreground text-sm">
              {{ t("dashboard.dnsWarningDesc") }}
            </p>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
