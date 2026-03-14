<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const toast = useToast();

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
  name: z.string().min(2, "Too short"),
  slug: z
    .string()
    .min(4, "Too short")
    .regex(
      /^[a-z0-9_-]+$/,
      "Slug must contain only lowercase letters, numbers, hyphens, and underscores",
    ),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
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
        title: "Error",
        description: err.message || "Failed to update organization",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Your settings have been updated.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to update organization",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="!activeOrg" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">Organization not found</h3>
    <p class="text-muted-foreground mb-4">
      Please select an organization from the menu or create a new one.
    </p>
    <UButton to="/dashboard/create-org">Create Organization</UButton>
  </div>

  <div v-else>
    <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
      <UPageCard
        title="Profile"
        description="These informations will be displayed publicly."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <UButton
          form="settings"
          label="Save changes"
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
