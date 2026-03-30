<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, t("admin.tooShort")),
  username: z
    .string()
    .min(5, t("auth.usernameMin5"))
    .regex(/^[a-zA-Z0-9_-]+$/, t("auth.usernameFormat"))
    .optional(),
  email: z.string().email(t("common.invalidEmail")),
  image: z.string().url(t("dashboard.invalidUrl")).optional().or(z.literal("")),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from user data
const profile = reactive({
  name: "",
  username: "",
  email: "",
  image: "",
});

// Initialize profile from session data
if (session.value?.user) {
  profile.name = session.value.user.name || "";
  profile.username = session.value.user.username || "";
  profile.email = session.value.user.email || "";
  profile.image = session.value.user.image || "";
}

// Loading state for form submission
const loading = ref(false);

// Update user profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!session.value?.user) return;

  loading.value = true;
  try {
    // Check if email is being changed
    const emailChanged = event.data.email !== session.value.user.email;

    // If email changed, initiate email change flow
    if (emailChanged) {
      const { error } = await authClient.changeEmail({
        newEmail: event.data.email,
        callbackURL: "/dashboard/settings",
      });

      if (error) {
        toast.add({
          title: t("common.error"),
          description: error.message || t("dashboard.failedToChangeEmail"),
          color: "error",
        });
        return;
      }

      toast.add({
        title: t("dashboard.emailChangeInitiated"),
        description: t("dashboard.emailChangeVerifyDesc"),
        icon: "i-lucide-mail",
        color: "success",
      });
      return;
    }

    // Update other profile fields
    const { data, error } = await authClient.updateUser({
      name: event.data.name,
      username: event.data.username || undefined,
      image: event.data.image || undefined,
    });

    if (error) {
      toast.add({
        title: t("common.error"),
        description: error.message || "Failed to update profile",
        color: "error",
      });
      return;
    }

    // Refresh session after successful update by fetching it again
    const { data: newSession } = await authClient.getSession();
    if (newSession) {
      session.value = newSession as typeof session.value;
      // Update profile form with new data
      if (newSession.user) {
        profile.name = newSession.user.name || "";
        profile.username = newSession.user.username || "";
        profile.email = newSession.user.email || "";
        profile.image = newSession.user.image || "";
      }
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.profileUpdated"),
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : "Failed to update profile",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="!session?.user" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
      {{ t("common.notAuthenticated") }}
    </h3>
    <p class="text-muted-foreground mb-4">{{ t("dashboard.pleaseSignInProfile") }}</p>
    <UButton to="/auth/sign-in">{{ t("common.signIn") }}</UButton>
  </div>

  <div v-else>
    <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
      <UPageCard
        :title="t('dashboard.profile')"
        :description="t('dashboard.profilePublicInfo')"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="flex w-fit gap-3 lg:ms-auto">
          <UButton
            to="/dashboard/settings/security"
            :label="t('dashboard.securitySettingsBtn')"
            color="neutral"
            variant="outline"
          />
          <UButton
            form="settings"
            :label="t('dashboard.saveChanges')"
            color="neutral"
            type="submit"
            :loading="loading"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          :label="t('common.name')"
          :description="t('dashboard.nameDisplayDesc')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.name" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="username"
          :label="t('common.username')"
          :description="t('dashboard.usernameDesc')"
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.username" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="email"
          :label="t('common.email')"
          :description="t('dashboard.emailChangeDesc')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.email" type="email" />
        </UFormField>
        <USeparator />
        <UFormField
          name="image"
          :label="t('dashboard.avatarUrl')"
          :description="t('dashboard.avatarUrlDesc')"
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput
            v-model="profile.image"
            :placeholder="t('dashboard.avatarPlaceholder')"
            autocomplete="off"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
