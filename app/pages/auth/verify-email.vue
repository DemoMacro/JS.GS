<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const toast = useToast();
const { t } = useI18n();

definePageMeta({
  layout: "app",
});

const schema = z.object({
  email: z.string().email(t("auth.invalidEmail")),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const { error } = await authClient.sendVerificationEmail({
      email: payload.data.email,
    });

    if (error) {
      toast.add({
        title: t("auth.sendVerificationError"),
        description: error.message || t("auth.failedToSendVerification"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("auth.verificationSent"),
      description: t("auth.verificationSentDesc"),
      color: "success",
    });
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
</script>

<template>
  <div class="bg-background flex min-h-screen items-center justify-center px-4 py-12">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        :title="t('auth.verifyTitle')"
        :description="t('auth.verifyDescription')"
        icon="i-lucide-mail"
        :fields="[
          {
            name: 'email',
            type: 'email',
            label: t('common.email'),
            required: true,
          },
        ]"
        :submit="{
          label: t('auth.sendVerification'),
          loading,
          block: true,
        }"
        @submit="onSubmit"
      >
        <template #footer>
          <div class="text-muted text-center text-sm">
            <span>{{ t("auth.alreadyVerified") }}</span>
            <ULink to="/auth/sign-in" class="text-primary font-medium">
              {{ t("common.signIn") }}
            </ULink>
          </div>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
