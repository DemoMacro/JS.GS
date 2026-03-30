<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const { t } = useI18n();

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

const slugDescription = computed(() =>
  props.isPersonalOrg ? t("dashboard.orgSlugManaged") : t("dashboard.orgSlugDesc"),
);

const slugHint = computed(() =>
  props.isPersonalOrg ? t("dashboard.managedAutomatically") : undefined,
);
</script>

<template>
  <UFormField
    name="name"
    :label="t('dashboard.orgName')"
    :description="t('dashboard.orgDisplayName')"
    required
    class="flex items-start justify-between gap-4 max-sm:flex-col"
  >
    <UInput
      v-model="state.name"
      :placeholder="t('dashboard.orgNamePlaceholder')"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>

  <USeparator />

  <UFormField
    name="slug"
    :label="t('dashboard.orgSlug')"
    :description="slugDescription"
    required
    class="flex items-start justify-between gap-4 max-sm:flex-col"
  >
    <UInput
      v-model="state.slug"
      :placeholder="t('dashboard.orgSlugPlaceholder')"
      autocomplete="off"
      :disabled="submitting || isPersonalOrg"
      :hint="slugHint"
    />
  </UFormField>

  <USeparator />

  <UFormField
    name="logo"
    :label="t('dashboard.logoUrl')"
    :description="t('dashboard.orgLogoUrlDesc')"
    class="flex items-start justify-between gap-4 max-sm:flex-col"
  >
    <UInput
      v-model="state.logo"
      type="url"
      :placeholder="t('admin.logoPlaceholder')"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>
</template>
