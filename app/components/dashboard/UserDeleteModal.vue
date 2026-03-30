<script setup lang="ts">
import type { UserWithRole } from "better-auth/plugins";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

const props = defineProps<{
  user: UserWithRole | null;
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const emit = defineEmits<{
  refresh: [];
}>();

// Form schema
const schema = z.object({
  confirmText: z.string().refine((val) => val === props.user?.email || val === props.user?.name, {
    message: t("dashboard.enterUserConfirm"),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: "",
});

// Delete user using Better-Auth admin plugin
async function deleteUser() {
  if (!props.user?.id) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.userIdRequired"),
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.admin.removeUser({
      userId: props.user.id,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("dashboard.failedToDeleteUser"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.userDeleted", { email: props.user.email }),
      color: "success",
    });

    emit("refresh");
    open.value = false;

    // Reset form
    state.confirmText = "";
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.deleteUserError"),
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
    :title="t('admin.deleteUser')"
    :description="t('dashboard.confirmDeleteUserDesc')"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <p class="text-muted-foreground">
          {{ t("dashboard.cannotBeUndone") }} {{ t("dashboard.confirmDeleteUserDesc") }}
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteUser">
          <UFormField
            name="confirmText"
            :label="t('common.typeToConfirm', { name: props.user?.email || props.user?.name })"
            :description="t('dashboard.enterUserConfirm')"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="props.user?.email || props.user?.name"
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
              :disabled="state.confirmText !== (props.user?.email || props.user?.name)"
            >
              {{ t("admin.deleteUser") }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
