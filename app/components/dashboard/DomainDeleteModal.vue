<script setup lang="ts">
import * as z from "zod";
import type { Domain } from "~~/shared/types/domain";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

const props = defineProps<{
  domain: Domain | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  confirmText: z.string().refine((val) => val === props.domain?.domainName, {
    message: t("dashboard.enterDomainConfirm"),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: "",
});

async function deleteDomain() {
  if (!props.domain?.id) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.domainIdRequired"),
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.domain.delete({
      domainId: props.domain.id,
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
      description: t("dashboard.domainDeleted", { name: props.domain.domainName }),
      color: "success",
    });

    emit("refresh");
    open.value = false;
    state.confirmText = "";
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("common.unexpectedError"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('dashboard.deleteDomain')"
    :description="t('dashboard.cannotBeUndone')"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="domain"
          color="error"
          icon="i-lucide-alert-triangle"
          :title="t('common.warning')"
        >
          <template #description>
            <div class="space-y-1">
              <p>{{ t("dashboard.confirmDeleteDomainDesc") }}</p>
              <p class="font-mono text-sm font-semibold">{{ domain.domainName }}</p>
            </div>
          </template>
        </UAlert>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteDomain">
          <UFormField
            name="confirmText"
            :label="t('common.typeToConfirm', { name: domain?.domainName })"
            :description="t('dashboard.enterDomainConfirm')"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="domain?.domainName"
              :disabled="loading"
              class="w-full font-mono"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="open = false" :disabled="loading">
              {{ t("common.cancel") }}
            </UButton>
            <UButton
              color="error"
              type="submit"
              :loading="loading"
              :disabled="state.confirmText !== domain?.domainName"
            >
              <template #leading>
                <UIcon name="i-lucide-trash" />
              </template>
              {{ t("dashboard.deleteDomain") }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
