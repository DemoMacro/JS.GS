<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const route = useRoute();
const orgId = route.params.id as string;
const toast = useToast();
const { t } = useI18n();

// Use composable for organization data
const { organization, loading, updateOrg } = useOrg(orgId);

// Check if current organization is a personal org
const isPersonalOrg = computed(() => {
  return organization.value?.slug?.startsWith("user_") ?? false;
});

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, t("admin.tooShort")),
  slug: z
    .string()
    .min(4, t("admin.tooShort"))
    .regex(/^[a-z0-9_-]+$/, t("dashboard.orgSlugFormat")),
  logo: z.string().url(t("admin.invalidUrl")).optional().or(z.literal("")),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from organization data
const profile = computed(() => {
  if (!organization.value) return { name: "", slug: "", logo: "" };
  return {
    name: organization.value.name || "",
    slug: organization.value.slug || "",
    logo: organization.value.logo || "",
  };
});

// Update organization profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!organization.value) return;

  try {
    await updateOrg(event.data);
    toast.add({
      title: t("common.success"),
      description: t("dashboard.orgUpdated"),
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("dashboard.failedToUpdateOrg"),
      color: "error",
    });
  }
};
</script>

<template>
  <div v-if="loading" class="flex h-64 items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
  </div>

  <div v-else-if="!organization" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
      {{ t("dashboard.orgNotFound") }}
    </h3>
    <p class="text-muted-foreground mb-4">
      {{ t("dashboard.orgNotFoundDesc") }}
    </p>
    <UButton to="/admin/orgs">{{ t("dashboard.backToOrgs") }}</UButton>
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
        <UButton
          form="settings"
          :label="t('dashboard.saveChanges')"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <DashboardOrgForm
          :schema="profileSchema"
          :state="profile"
          :submitting="loading"
          :isPersonalOrg="isPersonalOrg"
        />
      </UPageCard>
    </UForm>
  </div>
</template>
