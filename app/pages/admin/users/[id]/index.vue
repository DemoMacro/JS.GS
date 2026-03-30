<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const { t } = useI18n();

const route = useRoute();
const userId = route.params.id as string;
const toast = useToast();

// Use composable for user data
const { user, loading, updateUser } = useUser(userId);

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, t("admin.tooShort")),
  email: z.string().email(t("auth.invalidEmail")),
  role: z.enum(["user", "admin"]).refine((val) => val !== undefined, {
    message: t("admin.pleaseSelectRole"),
  }),
  image: z.string().url(t("admin.invalidUrl")).optional().or(z.literal("")),
  emailVerified: z.boolean().optional(),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from user data
const profile = computed(() => {
  if (!user.value) return { name: "", email: "", role: "user" as const, image: "" };
  return {
    name: user.value.name || "",
    email: user.value.email || "",
    role: (user.value.role as "user" | "admin") || "user",
    image: user.value.image || "",
    emailVerified: user.value.emailVerified || false,
  };
});

// Update user profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!user.value) return;

  try {
    await updateUser(event.data);
    toast.add({
      title: t("common.success"),
      description: t("admin.userProfileUpdated"),
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("admin.failedToUpdateUser"),
      color: "error",
    });
  }
};
</script>

<template>
  <div v-if="loading" class="flex h-64 items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
  </div>

  <div v-else-if="!user" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">{{ t("admin.userNotFound") }}</h3>
    <p class="text-muted-foreground mb-4">
      {{ t("admin.userNotFoundDesc") }}
    </p>
    <UButton to="/admin/users">{{ t("admin.backToUsers") }}</UButton>
  </div>

  <div v-else>
    <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
      <UPageCard
        :title="t('admin.profile')"
        :description="t('admin.profilePublicInfo')"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="flex w-fit gap-3 lg:ms-auto">
          <UButton
            :to="`/admin/users/${userId}/security`"
            :label="t('admin.securitySettingsBtn')"
            color="neutral"
            variant="outline"
          />
          <UButton
            form="settings"
            :label="t('dashboard.saveChanges')"
            color="neutral"
            type="submit"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          :label="t('common.name')"
          :description="t('admin.nameDisplayDesc')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.name" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="email"
          :label="t('common.email')"
          :description="t('admin.thisIsEmail')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="profile.email" type="email" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="image"
          :label="t('admin.avatarUrl')"
          :description="t('admin.avatarUrlDescUser')"
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput
            v-model="profile.image"
            :placeholder="t('admin.avatarPlaceholder')"
            autocomplete="off"
          />
        </UFormField>
        <USeparator />
        <UFormField
          name="emailVerified"
          :label="t('admin.emailVerified')"
          :description="t('admin.emailVerifiedDesc')"
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UCheckbox v-model="profile.emailVerified" />
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
            v-model="profile.role"
            :items="[
              { label: t('common.user'), value: 'user' },
              { label: t('common.admin'), value: 'admin' },
            ]"
            class="w-full"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>
