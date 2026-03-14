<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

interface Props {
  schema: z.ZodObject<any>;
  state: Partial<Record<string, any>>;
  submitting?: boolean;
  isPersonalOrg?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
  isPersonalOrg: false,
});

const emit = defineEmits<{
  submit: [event: FormSubmitEvent<any>];
}>();
</script>

<template>
  <UFormField
    name="name"
    label="Organization Name"
    description="The display name for your organization."
    required
    class="flex items-start justify-between gap-4 max-sm:flex-col"
  >
    <UInput
      v-model="state.name"
      placeholder="Acme Corp"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>

  <USeparator />

  <UFormField
    name="slug"
    label="Slug"
    :description="
      isPersonalOrg
        ? 'Personal organization slug is managed automatically.'
        : 'Unique identifier used in URLs and API calls.'
    "
    required
    class="flex items-start justify-between gap-4 max-sm:flex-col"
  >
    <UInput
      v-model="state.slug"
      placeholder="acme-corp"
      autocomplete="off"
      :disabled="submitting || isPersonalOrg"
      :hint="isPersonalOrg ? 'Managed automatically' : undefined"
    />
  </UFormField>

  <USeparator />

  <UFormField
    name="logo"
    label="Logo URL"
    description="Organization logo image URL."
    class="flex items-start justify-between gap-4 max-sm:flex-col"
  >
    <UInput
      v-model="state.logo"
      type="url"
      placeholder="https://example.com/logo.png"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>
</template>
