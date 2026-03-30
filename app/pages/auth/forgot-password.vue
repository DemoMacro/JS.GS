<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const toast = useToast();
const { t } = useI18n();
const loading = ref(false);
const emailSent = ref(false);

definePageMeta({
  layout: "app",
});

const fields = computed<AuthFormField[]>(() => [
  {
    name: "email",
    type: "email",
    label: t("auth.emailAddress"),
    required: true,
  },
]);

const schema = z.object({
  email: z.email(t("auth.validEmailRequired")),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const result = await authClient.requestPasswordReset({
      email: payload.data.email,
      redirectTo: "/auth/sign-in",
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("auth.failedToSendReset"),
        color: "error",
      });
      return;
    }

    emailSent.value = true;
    toast.add({
      title: t("auth.emailSent"),
      description: t("auth.emailSentDesc"),
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
      <template v-if="!emailSent">
        <UAuthForm
          :schema="schema"
          :fields="fields"
          :title="t('auth.forgotTitle')"
          :description="t('auth.forgotDescription')"
          icon="i-lucide-mail"
          :submit="{
            label: t('auth.sendResetLink'),
            loading,
            block: true,
          }"
          @submit="onSubmit"
        >
          <template #description>
            {{ t("auth.rememberPassword") }}
            <ULink to="/auth/sign-in" class="text-primary font-medium">
              {{ t("common.signIn") }}
            </ULink>
          </template>

          <template #validation>
            <div id="error-message" />
          </template>
        </UAuthForm>
      </template>

      <template v-else>
        <div class="space-y-6 text-center">
          <div class="flex justify-center">
            <UIcon name="i-lucide-mail-check" class="text-primary size-16" />
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-semibold">{{ t("auth.checkYourEmail") }}</h2>
            <p class="text-muted">
              {{ t("auth.checkYourEmailDesc") }}
            </p>
          </div>
          <div class="space-y-4">
            <p class="text-muted text-sm">
              {{ t("auth.notReceivedEmail") }}
            </p>
            <UButton
              :label="t('auth.resendEmail')"
              variant="outline"
              block
              @click="emailSent = false"
            />
          </div>
          <div class="border-t pt-4">
            <ULink to="/auth/sign-in" class="text-primary font-medium">
              {{ t("auth.backToSignIn") }}
            </ULink>
          </div>
        </div>
      </template>
    </UPageCard>
  </div>
</template>
