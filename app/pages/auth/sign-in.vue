<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const toast = useToast();
const { t } = useI18n();

definePageMeta({
  layout: "app",
});

const fields = computed<AuthFormField[]>(() => [
  {
    name: "identifier",
    type: "text",
    label: t("auth.emailOrUsername"),
    required: true,
  },
  {
    name: "password",
    label: t("common.password"),
    type: "password",
    required: true,
  },
  {
    name: "rememberMe",
    label: t("auth.rememberMe"),
    type: "checkbox",
  },
]);

const schema = z.object({
  identifier: z.string().min(1, t("auth.emailOrUsernameRequired")),
  password: z.string().min(6, t("auth.passwordMin6")),
  rememberMe: z.boolean().optional(),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    // Check if identifier is email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.data.identifier);

    const { data, error } = isEmail
      ? await authClient.signIn.email({
          email: payload.data.identifier,
          password: payload.data.password,
          rememberMe: payload.data.rememberMe,
          callbackURL: "/dashboard",
        })
      : await authClient.signIn.username({
          username: payload.data.identifier,
          password: payload.data.password,
          rememberMe: payload.data.rememberMe,
          callbackURL: "/dashboard",
        });

    if (error) {
      // Handle email verification required error (403)
      if (error.status === 403) {
        toast.add({
          title: t("auth.verificationRequired"),
          description: t("auth.verificationRequiredDesc"),
          color: "warning",
        });
        return;
      }

      toast.add({
        title: t("auth.signInError"),
        description: error.message || t("auth.invalidCredentials"),
        color: "error",
      });
      return;
    }

    // Refresh session after successful sign in
    if (data) {
      await authClient.getSession();

      await navigateTo("/dashboard", { replace: true });
    }

    toast.add({
      title: t("auth.welcomeBack"),
      description: t("auth.signedIn"),
      color: "success",
    });
  } catch {
    toast.add({
      title: t("auth.signInError"),
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
        :title="t('auth.signInTitle')"
        :description="t('auth.signInDescription')"
        icon="i-lucide-user"
        :fields="fields"
        :submit="{
          label: t('common.signIn'),
          loading,
          block: true,
        }"
        @submit="onSubmit"
      >
        <template #description>
          {{ t("auth.noAccount") }}
          <ULink to="/auth/sign-up" class="text-primary font-medium">
            {{ t("common.signUp") }} </ULink
          >.
        </template>

        <template #footer>
          <div class="mt-4 flex flex-col gap-2">
            <div class="flex items-center justify-between text-sm">
              <ULink to="/auth/forgot-password" class="text-primary">
                {{ t("auth.forgotPassword") }}
              </ULink>
              <ULink to="/auth/verify-email" class="text-primary">
                {{ t("auth.resendVerification") }}
              </ULink>
            </div>
          </div>
        </template>

        <template #validation>
          <div id="error-message" />
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
