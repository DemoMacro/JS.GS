<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const toast = useToast();
const { t } = useI18n();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const loading = ref(false);
const error = ref<string | null>(null);

// Check if current organization is a personal org
const isPersonalOrg = computed(() => {
  return activeOrg.value?.slug?.startsWith("user_") ?? false;
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
  if (!activeOrg.value) return { name: "", slug: "", logo: "" };
  return {
    name: activeOrg.value.name || "",
    slug: activeOrg.value.slug || "",
    logo: activeOrg.value.logo || "",
  };
});

// Update organization profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!activeOrg.value) return;

  loading.value = true;
  try {
    // For personal organizations, don't include slug in update
    const updateData = isPersonalOrg.value
      ? {
          name: event.data.name,
          logo: event.data.logo || undefined,
        }
      : {
          name: event.data.name,
          slug: event.data.slug,
          logo: event.data.logo || undefined,
        };

    const { error: err } = await authClient.organization.update({
      data: updateData,
    });

    if (err) {
      toast.add({
        title: t("common.error"),
        description: err.message || t("dashboard.failedToUpdateOrg"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.orgUpdated"),
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: t("common.error"),
      description: err instanceof Error ? err.message : t("dashboard.failedToUpdateOrg"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="!activeOrg" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
      {{ t("dashboard.orgNotFound") }}
    </h3>
    <p class="text-muted-foreground mb-4">
      {{ t("dashboard.noActiveOrgDesc") }}
    </p>
    <UButton to="/dashboard/create-org">{{ t("dashboard.createOrg") }}</UButton>
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
          :loading="loading"
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
