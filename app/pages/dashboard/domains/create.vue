<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

definePageMeta({
  title: "Create Domain - Dashboard - JS.GS",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const schema = z.object({
  domainName: z.string().min(1, "Please enter a domain name"),
  organizationId: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  domainName: "",
  organizationId: "",
});

const submitting = ref(false);

async function createDomain(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.domain.create({
      domainName: event.data.domainName,
      organizationId: activeOrg.value?.id || null,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create domain",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Domain created successfully. Please verify ownership via DNS.",
      color: "success",
    });

    await navigateTo("/dashboard/domains");
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="create-domain">
    <template #header>
      <UDashboardNavbar title="Create Domain">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="mx-auto flex w-full flex-col gap-4 sm:gap-6 lg:max-w-2xl lg:gap-12">
        <UForm id="create-domain" :schema="schema" :state="state" @submit="createDomain">
          <UPageCard
            title="Add Custom Domain"
            description="Add a custom domain to use with your short links."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="ms-auto flex gap-3">
              <UButton variant="outline" to="/dashboard/domains" :disabled="submitting">
                Cancel
              </UButton>
              <UButton
                form="create-domain"
                label="Create Domain"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="domainName"
              label="Domain Name"
              description="The domain you want to use (e.g., example.com)."
              required
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput
                v-model="state.domainName"
                placeholder="example.com"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <UFormField
              name="organizationId"
              label="Organization"
              :description="
                activeOrg ? `Creating for: ${activeOrg.name}` : 'Creating as personal domain'
              "
              class="flex items-start justify-between gap-4 max-sm:flex-col"
            >
              <UInput :model-value="activeOrg?.name || 'Personal'" disabled class="w-full" />
            </UFormField>

            <USeparator />

            <p class="text-sm font-medium">⚠️ DNS Verification Required</p>
            <p class="text-muted-foreground text-sm">
              After creating this domain, you'll need to verify ownership by adding a TXT record to
              your domain's DNS configuration.
            </p>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>
