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
    name: "name",
    type: "text",
    label: t("auth.fullName"),
    required: true,
  },
  {
    name: "username",
    type: "text",
    label: t("common.username"),
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: t("common.email"),
    required: true,
  },
  {
    name: "password",
    label: t("common.password"),
    type: "password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: t("auth.confirmPassword"),
    type: "password",
    required: true,
  },
  {
    name: "terms",
    label: t("auth.agreeToTerms"),
    type: "checkbox",
    required: true,
  },
]);

const schema = z
  .object({
    name: z.string().min(2, t("auth.nameMin2")),
    username: z
      .string()
      .min(5, t("auth.usernameMin5"))
      .max(30, t("auth.usernameMax30"))
      .regex(/^[a-zA-Z0-9_-]+$/, t("auth.usernameFormat")),
    email: z.string().email(t("auth.invalidEmail")),
    password: z.string().min(8, t("auth.passwordMin8")),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, t("auth.termsRequired")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth.passwordsDontMatch"),
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const { data, error } = await authClient.signUp.email({
      name: payload.data.name,
      username: payload.data.username,
      email: payload.data.email,
      password: payload.data.password,
    });

    if (error) {
      toast.add({
        title: t("auth.signUpError"),
        description: error.message || t("auth.failedToCreateAccount"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("auth.accountCreated"),
      description: t("auth.accountCreatedDesc"),
      color: "success",
    });

    // Redirect to sign-in page
    await navigateTo("/auth/sign-in");
  } catch {
    toast.add({
      title: t("auth.signUpError"),
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
        :title="t('auth.signUpTitle')"
        :description="t('auth.signUpDescription')"
        icon="i-lucide-user-plus"
        :fields="fields"
        :submit="{
          label: t('auth.createAccount'),
          loading,
          block: true,
        }"
        @submit="onSubmit"
      >
        <template #description>
          {{ t("auth.hasAccount") }}
          <ULink to="/auth/sign-in" class="text-primary font-medium">
            {{ t("common.signIn") }} </ULink
          >.
        </template>

        <template #password-hint>
          <p class="text-muted text-sm">{{ t("auth.passwordHint") }}</p>
        </template>

        <template #validation>
          <div id="error-message" />
        </template>

        <template #footer>
          <p class="text-muted text-center text-sm">
            {{ t("auth.agreePrefix") }}
            <ULink to="/terms" class="text-primary font-medium">
              {{ t("auth.termsOfService") }}
            </ULink>
            {{ t("common.and") }}
            <ULink to="/privacy" class="text-primary font-medium">
              {{ t("auth.privacyPolicy") }} </ULink
            >.
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
