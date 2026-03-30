<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

// Form schema
const schema = z.object({
  email: z.string().email(t("auth.invalidEmail")),
  name: z.string().min(1, t("admin.orgNameRequired")),
  username: z
    .string()
    .min(5, t("auth.usernameMin5"))
    .max(30, t("auth.usernameMax30"))
    .regex(/^[a-zA-Z0-9_-]+$/, t("auth.usernameFormat")),
  password: z.string().min(6, t("auth.passwordMin6")),
  role: z.enum(["user", "admin"]).refine((val) => val !== undefined, {
    message: t("admin.pleaseSelectRole"),
  }),
});

type Schema = z.output<typeof schema>;

// Form state
const state = reactive<Schema>({
  email: "",
  name: "",
  username: "",
  password: "",
  role: "user",
});

const submitting = ref(false);

// Create user
async function createUser(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.admin.createUser({
      email: event.data.email,
      name: event.data.name,
      password: event.data.password,
      role: event.data.role,
      data: {
        username: event.data.username,
        displayUsername: event.data.username,
      },
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("admin.failedToCreateUser"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("admin.userCreated", { name: event.data.email }),
      color: "success",
    });

    // Redirect to users list
    await navigateTo("/admin/users");
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
  <UDashboardPanel id="create-user">
    <template #header>
      <UDashboardNavbar :title="t('admin.createUser')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <UForm id="create-user" :schema="schema" :state="state" @submit="createUser">
          <UPageCard
            :title="t('admin.createUser')"
            :description="t('admin.createUserDesc')"
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="ms-auto flex gap-3">
              <UButton variant="outline" to="/admin/users" :disabled="submitting">
                {{ t("common.cancel") }}
              </UButton>
              <UButton
                form="create-user"
                :label="t('admin.createUser')"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-user-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="email"
              :label="t('auth.emailAddress')"
              :description="t('admin.emailDescUser')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                v-model="state.email"
                type="email"
                :placeholder="t('admin.emailPlaceholder')"
                autocomplete="off"
                :disabled="submitting"
              />
            </UFormField>
            <USeparator />
            <UFormField
              name="name"
              :label="t('auth.fullName')"
              :description="t('admin.displayNameDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                v-model="state.name"
                :placeholder="t('admin.namePlaceholder')"
                autocomplete="off"
                :disabled="submitting"
              />
            </UFormField>
            <USeparator />
            <UFormField
              name="username"
              :label="t('common.username')"
              :description="t('admin.uniqueUsernameDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                v-model="state.username"
                placeholder="johndoe"
                autocomplete="off"
                :disabled="submitting"
              />
            </UFormField>
            <USeparator />
            <UFormField
              name="password"
              :label="t('common.password')"
              :description="t('admin.initialPasswordDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <div class="flex gap-2">
                <UInput
                  v-model="state.password"
                  type="password"
                  :placeholder="t('admin.passwordPlaceholder')"
                  autocomplete="off"
                  :disabled="submitting"
                  class="flex-1"
                />
              </div>
            </UFormField>
            <USeparator />
            <UFormField
              name="role"
              :label="t('common.role')"
              :description="t('admin.roleAccessDesc')"
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <USelect
                v-model="state.role"
                :items="[
                  { label: t('common.user'), value: 'user' },
                  { label: t('common.admin'), value: 'admin' },
                ]"
                class="w-full"
                :disabled="submitting"
              />
            </UFormField>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
