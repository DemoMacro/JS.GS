<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

const schema = z.object({
  organizationId: z.string().optional(),
  originalUrl: z.string().url(t("home.validUrlRequired")),
  domainId: z.string().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  expiresAt: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  organizationId: undefined,
  originalUrl: undefined,
  domainId: "default",
  title: undefined,
  description: undefined,
  status: "active",
  expiresAt: undefined,
});

const submitting = ref(false);

async function createLink(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.link.create({
      originalUrl: event.data.originalUrl!,
      domainId: event.data.domainId === "default" ? null : event.data.domainId || null,
      title: event.data.title || null,
      description: event.data.description || null,
      status: event.data.status || "active",
      expiresAt: event.data.expiresAt ? new Date(event.data.expiresAt) : null,
      organizationId: event.data.organizationId || null,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("dashboard.failedToCreateLink"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.linkCreated"),
      color: "success",
    });

    await navigateTo("/dashboard/links");
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
  <UDashboardPanel id="create-link">
    <template #header>
      <UDashboardNavbar :title="t('dashboard.createShortLink')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto w-full lg:max-w-2xl">
        <UForm id="create-link" :schema="schema" :state="state" @submit="createLink">
          <UPageCard
            :title="t('dashboard.createShortLink')"
            :description="t('dashboard.createShortLinkDesc')"
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="ms-auto flex gap-3">
              <UButton variant="outline" to="/dashboard/links" :disabled="submitting">
                {{ t("common.cancel") }}
              </UButton>
              <UButton
                :label="t('dashboard.createLink')"
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

          <DashboardLinkForm :schema="schema" :state="state" :submitting="submitting" />
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
