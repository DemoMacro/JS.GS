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
  name: z.string().min(1, t("admin.orgNameRequired")),
  slug: z
    .string()
    .min(4, t("admin.orgSlugRequired"))
    .regex(/^[a-z0-9_-]+$/, t("admin.orgSlugFormat")),
  logo: z.string().url(t("admin.invalidUrl")).optional().or(z.literal("")),
});

type Schema = z.output<typeof schema>;

// Form state
const state = reactive<Schema>({
  name: "",
  slug: "",
  logo: "",
});

const submitting = ref(false);
const userEditedSlug = ref(false);

// Auto-generate slug from name
watch(
  () => state.name,
  (newName) => {
    if (newName && !userEditedSlug.value) {
      state.slug = newName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }
  },
);

// Track when user manually edits slug (but not on initial load or auto-generated)
watch(
  () => state.slug,
  (newSlug, oldSlug) => {
    // Don't mark as user edited during initial setup or when slug is being auto-generated
    // Only mark as user edited when there's an actual manual change
    if (oldSlug !== undefined && newSlug !== oldSlug && state.name !== "") {
      // Check if this looks like an auto-generated slug vs manual input
      const expectedSlug = state.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      // Only mark as user edited if the new slug doesn't match what would be auto-generated
      if (newSlug !== expectedSlug) {
        userEditedSlug.value = true;
      }
    }
  },
);

// Create organization
async function createOrganization(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.organization.create({
      name: event.data.name,
      slug: event.data.slug,
      logo: event.data.logo || undefined,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("admin.failedToCreateOrg"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("admin.orgCreated", { name: event.data.name }),
      color: "success",
    });

    // Refresh organizations list in OrgsMenu
    refreshNuxtData("organizations");

    // Redirect to organizations list
    await navigateTo("/admin/orgs");
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
  <UDashboardPanel id="create-organization">
    <template #header>
      <UDashboardNavbar :title="t('admin.createOrganization')">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <UForm
          id="create-organization"
          :schema="schema"
          :state="state"
          @submit="createOrganization"
        >
          <UPageCard
            :title="t('admin.createOrganization')"
            :description="t('admin.createOrgDesc')"
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="ms-auto flex gap-3">
              <UButton variant="outline" to="/admin/orgs" :disabled="submitting">
                {{ t("common.cancel") }}
              </UButton>
              <UButton
                form="create-organization"
                :label="t('admin.createOrganization')"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-building" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <DashboardOrgForm :schema="schema" :state="state" :submitting="submitting" />
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
