<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { Organization } from "better-auth/plugins";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

const props = defineProps<{
  organization: Organization | null | undefined;
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const emit = defineEmits<{
  refresh: [];
}>();

// Form schema
const schema = z.object({
  email: z.string().email(t("auth.invalidEmail")),
  role: z.enum(["owner", "admin", "member"]).refine((val) => val !== undefined, {
    message: t("admin.pleaseSelectRole"),
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  role: "member",
});

const roleItems = computed(() => [
  { label: t("common.member"), value: "member" },
  { label: t("common.admin"), value: "admin" },
  { label: t("common.owner"), value: "owner" },
]);

async function onSubmit(event: FormSubmitEvent<Schema>) {
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
    const result = await authClient.organization.inviteMember({
      email: event.data.email,
      role: event.data.role,
      organizationId: props.organization.id,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("dashboard.failedToAddMember"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.memberInvited", { email: event.data.email }),
      color: "success",
    });

    emit("refresh");
    open.value = false;

    // Reset form
    state.email = undefined;
    state.role = "member";
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.addMemberError"),
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
    :title="t('dashboard.addOrgMember')"
    :description="t('dashboard.addOrgMemberDesc')"
  >
    <slot />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField
          :label="t('auth.emailAddress')"
          name="email"
          :description="t('dashboard.memberEmailDesc')"
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="user@example.com"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="t('common.role')"
          name="role"
          :description="t('dashboard.memberRoleDesc')"
        >
          <USelect v-model="state.role" :items="roleItems" :disabled="loading" class="w-full" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            :label="t('common.cancel')"
            color="neutral"
            variant="outline"
            @click="open = false"
            :disabled="loading"
          />
          <UButton
            :label="t('dashboard.addMember')"
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!state.email"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
