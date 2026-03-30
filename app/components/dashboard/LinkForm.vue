<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { useDomains } from "~/composables/useDomains";
import { useOrganizations } from "~/composables/useOrganizations";

const { t } = useI18n();

interface Props {
  schema: z.ZodObject<any>;
  state: Partial<Record<string, any>>;
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
});

const emit = defineEmits<{
  submit: [event: FormSubmitEvent<any>];
}>();

const { domainOptions, loading: domainsLoading } = useDomains();

// Get user's organizations
const { organizations, loading: orgsLoading } = useOrganizations();

// Organization options for select
const organizationOptions = computed(() =>
  organizations.value.map((org) => ({
    label: org.name,
    value: org.id,
  })),
);

const statusItems = computed(() => [
  { label: t("common.active"), value: "active" },
  { label: t("common.inactive"), value: "inactive" },
  { label: t("common.expired"), value: "expired" },
]);
</script>

<template>
  <UPageCard variant="subtle" class="mb-4">
    <UFormField
      name="organizationId"
      :label="t('dashboard.org')"
      :description="t('dashboard.selectOrgForDomain')"
      class="flex items-start justify-between gap-4 max-sm:flex-col"
    >
      <USelect
        v-model="state.organizationId"
        :items="organizationOptions"
        :disabled="submitting || orgsLoading"
        class="w-48"
        icon="i-lucide-building"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="originalUrl"
      :label="t('dashboard.destinationUrl')"
      :description="t('dashboard.destinationUrlDesc')"
      required
      class="flex flex-col gap-2"
    >
      <UInput
        v-model="state.originalUrl"
        :placeholder="t('dashboard.destinationUrlPlaceholder')"
        :disabled="submitting"
        class="w-full"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="domainId"
      :label="t('dashboard.customDomain')"
      :description="t('dashboard.customDomainDesc')"
      class="flex items-start justify-between gap-4 max-sm:flex-col"
    >
      <USelect
        v-if="domainOptions.length > 0"
        v-model="state.domainId"
        :items="domainOptions"
        :placeholder="t('dashboard.default')"
        icon="i-lucide-globe"
        :disabled="submitting || domainsLoading"
        class="w-48"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="title"
      :label="t('dashboard.linkTitleField')"
      :description="t('dashboard.linkTitleDesc')"
      class="flex items-start justify-between gap-4 max-sm:flex-col"
    >
      <UInput
        v-model="state.title"
        :placeholder="t('dashboard.linkTitlePlaceholder')"
        :disabled="submitting"
        class="w-48"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="description"
      :label="t('dashboard.linkDescriptionField')"
      :description="t('dashboard.linkDescriptionDesc')"
      class="flex flex-col gap-2"
    >
      <UTextarea
        v-model="state.description"
        :placeholder="t('dashboard.linkDescriptionPlaceholder')"
        :disabled="submitting"
        :rows="3"
        class="w-full"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="status"
      :label="t('dashboard.linkStatus')"
      :description="t('dashboard.linkStatusDesc')"
      required
      class="flex items-start justify-between gap-4 max-sm:flex-col"
    >
      <USelect
        v-model="state.status"
        :items="statusItems"
        :disabled="submitting"
        class="w-full sm:max-w-xs"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="expiresAt"
      :label="t('dashboard.expirationDate')"
      :description="t('dashboard.expirationDateDesc')"
      class="flex items-start justify-between gap-4 max-sm:flex-col"
    >
      <UInput
        v-model="state.expiresAt"
        type="datetime-local"
        :disabled="submitting"
        class="w-full sm:max-w-xs"
      />
    </UFormField>
  </UPageCard>
</template>
