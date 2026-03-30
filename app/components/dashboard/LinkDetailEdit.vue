<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

interface Props {
  linkId: string;
  backTo: string; // The back link path
}

const props = defineProps<Props>();

const { link, loading, fetchLink } = useLinkDetail(props.linkId);

const toast = useToast();

const schema = z.object({
  organizationId: z.string().optional(),
  originalUrl: z.string().url(t("home.validUrlRequired")),
  domainId: z.string().optional(),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  organizationId: undefined,
  originalUrl: undefined,
  domainId: undefined,
  title: undefined,
  description: undefined,
  status: undefined,
});

watch(
  () => link.value,
  (newLink) => {
    if (newLink) {
      state.organizationId = newLink.organizationId || undefined;
      state.originalUrl = newLink.originalUrl;
      state.domainId = newLink.domainId || "default";
      state.title = newLink.title ?? undefined;
      state.description = newLink.description ?? undefined;
      state.status = newLink.status ?? undefined;
    }
  },
  { immediate: true },
);

const submitting = ref(false);

async function updateLink(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.link.update({
      id: props.linkId,
      originalUrl: event.data.originalUrl!,
      domainId: event.data.domainId === "default" ? null : event.data.domainId || null,
      title: event.data.title || null,
      description: event.data.description || null,
      status: event.data.status,
      organizationId: event.data.organizationId || null,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("dashboard.failedToUpdateLink"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.linkUpdated"),
      color: "success",
    });

    await fetchLink();
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
  <div v-if="link" class="mx-auto w-full lg:max-w-2xl">
    <UForm id="edit-link" :schema="schema" :state="state" @submit="updateLink">
      <UPageCard
        :title="t('dashboard.editLink')"
        :description="t('dashboard.editLinkDesc')"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="ms-auto flex gap-3">
          <UButton variant="outline" :to="backTo" :disabled="submitting">
            {{ t("common.cancel") }}
          </UButton>
          <UButton
            :label="t('dashboard.saveChanges')"
            color="primary"
            type="submit"
            :loading="submitting"
          >
            <template #leading>
              <UIcon name="i-lucide-save" />
            </template>
          </UButton>
        </div>
      </UPageCard>

      <DashboardLinkForm :schema="schema" :state="state" :submitting="submitting" />
    </UForm>
  </div>
</template>
