<script setup lang="ts">
import type { Organization } from "better-auth/plugins";
import * as z from "zod";

const { t } = useI18n();

const props = defineProps<{
  organization: Organization | null;
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

// Check if this is a personal organization
const isPersonalOrg = computed(() => {
  return props.organization?.slug?.startsWith("user_") ?? false;
});

// Watch modal open state to show toast for personal orgs
watch(open, (isOpen) => {
  if (isOpen && isPersonalOrg.value) {
    toast.add({
      title: t("dashboard.cannotDeletePersonalOrg"),
      description: t("dashboard.cannotDeletePersonalOrgDesc"),
      color: "error",
    });
    // Immediately close the modal
    open.value = false;
  }
});

const emit = defineEmits<{
  refresh: [];
}>();

// Form schema
const schema = z.object({
  confirmText: z.string().refine((val) => val === props.organization?.name, {
    message: t("dashboard.enterOrgNameConfirm"),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: undefined,
});

// Delete organization using Better-Auth organization plugin
async function deleteOrganization() {
  if (!props.organization?.id) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.orgIdRequired"),
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.organization.delete({
      organizationId: props.organization.id,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("admin.failedToCreateOrg"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.orgDeleted", { name: props.organization.name }),
      color: "success",
    });

    emit("refresh");
    open.value = false;

    // Reset form
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
    :title="t('admin.deleteOrganization')"
    :description="t('dashboard.confirmDeleteOrgDesc')"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteOrganization">
          <UFormField
            name="confirmText"
            :label="t('common.typeToConfirm', { name: props.organization?.name })"
            :description="t('dashboard.enterOrgNameConfirm')"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="props.organization?.name"
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
              :disabled="state.confirmText !== props.organization?.name"
            >
              {{ t("admin.deleteOrganization") }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
