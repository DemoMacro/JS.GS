<script setup lang="ts">
import * as z from "zod";
import type { Link } from "~~/shared/types/link";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

const props = defineProps<{
  link: Link | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  confirmText: z.string().refine((val) => val === props.link?.shortCode, {
    message: t("dashboard.enterShortCodeConfirm"),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: "",
});

async function deleteLink() {
  if (!props.link?.id) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.linkIdRequired"),
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.link.delete({
      linkId: props.link.id,
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
      description: t("dashboard.linkDeleted", { shortCode: props.link.shortCode }),
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
    :title="t('dashboard.deleteLink')"
    :description="t('dashboard.cannotBeUndone')"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <p class="text-muted-foreground">
          {{ t("dashboard.sureDeleteLink", { shortCode: link?.shortCode }) }}
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteLink">
          <UFormField
            name="confirmText"
            :label="t('common.typeToConfirm', { name: link?.shortCode })"
            :description="t('dashboard.enterShortCodeConfirm')"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="link?.shortCode"
              :disabled="loading"
              class="w-full"
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
              :disabled="state.confirmText !== link?.shortCode"
            >
              {{ t("dashboard.deleteLink") }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
