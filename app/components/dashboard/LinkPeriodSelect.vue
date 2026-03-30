<script setup lang="ts">
const { t } = useI18n();

type Period = "daily" | "weekly" | "monthly";

const model = defineModel<Period>({ required: true });

const items = computed(() => [
  { label: t("dashboard.last7Days"), value: "daily" },
  { label: t("dashboard.last30Days"), value: "weekly" },
  { label: t("dashboard.last90Days"), value: "monthly" },
]);
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{
      value: 'capitalize',
      itemLabel: 'capitalize',
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
    }"
  />
</template>
