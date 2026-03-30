<script setup lang="ts">
import { VisXYContainer, VisLine, VisArea, VisAxis, VisCrosshair, VisTooltip } from "@unovis/vue";
import { format } from "date-fns";

const { t } = useI18n();

interface Range {
  start: Date;
  end: Date;
}

interface Props {
  linkId: string;
  range?: Range;
}

const props = defineProps<Props>();

// Create a ref that uses parent's range if provided, otherwise creates default
const rangeRef = ref<Range>(
  props.range || {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
);

// Watch for changes from parent
watch(
  () => props.range,
  (newRange) => {
    if (newRange) {
      rangeRef.value = newRange;
    }
  },
  { immediate: true },
);

const {
  activeTab,
  totalClicks,
  uniqueVisitors,
  mobilePercentage,
  topCountry,
  chartData,
  countries,
  activeTabData,
  activeTabKey,
  loading,
  timeGranularity,
  setTimeGranularity,
  setTab,
} = useLinkAnalytics(props.linkId, rangeRef);

const cardRef = useTemplateRef<HTMLElement | null>("cardRef");
const { width } = useElementSize(cardRef);

type DataRecord = {
  date: Date;
  amount: number;
};

type AnalyticsRecord = {
  clicks: string | number;
  [key: string]: string | number;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US").format(value);
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay();
  const weekNumber = Math.ceil((dayOfMonth + firstDayOfWeek) / 7);
  return weekNumber;
};

const formatDate = (date: Date, granularity: typeof timeGranularity.value) => {
  switch (granularity) {
    case "hour":
      return format(date, "MMM d HH:00");
    case "day":
      return format(date, "MMM d");
    case "week":
      return `${format(date, "MMM")} Week ${getWeekOfMonth(date)}`;
    case "month":
      return format(date, "MMM yyyy");
    default:
      return format(date, "MMM d");
  }
};

const x = (_: DataRecord, i: number) => i;
const y = (d: DataRecord) => d.amount;

const xTicks = (i: number) => {
  if (!chartData.value[i]) return "";
  return formatDate(chartData.value[i].date, timeGranularity.value);
};

const template = (d: DataRecord) =>
  `${formatDate(d.date, timeGranularity.value)}: ${formatNumber(d.amount)} clicks`;

const getPercentage = (item: AnalyticsRecord) => {
  return totalClicks.value > 0 ? Math.round((Number(item.clicks) / totalClicks.value) * 100) : 0;
};

const granularityItems = ["hour", "day", "week", "month"];
</script>

<template>
  <div class="space-y-6">
    <!-- Top Metrics Cards -->
    <UPageGrid class="gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UPageCard
        icon="i-lucide-mouse-pointer-click"
        :title="t('dashboard.total')"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-xs uppercase',
        }"
      >
        <div class="flex items-center gap-2">
          <span class="text-highlighted text-2xl font-semibold">
            {{ formatNumber(totalClicks) }}
          </span>
        </div>
      </UPageCard>

      <UPageCard
        icon="i-lucide-users"
        :title="t('dashboard.uniqueVisitors')"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-xs uppercase',
        }"
      >
        <div class="flex items-center gap-2">
          <span class="text-highlighted text-2xl font-semibold">
            {{ formatNumber(uniqueVisitors) }}
          </span>
        </div>
      </UPageCard>

      <UPageCard
        icon="i-lucide-smartphone"
        :title="t('dashboard.mobilePercentage')"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-xs uppercase',
        }"
      >
        <div class="flex items-center gap-2">
          <span class="text-highlighted text-2xl font-semibold"> {{ mobilePercentage }}% </span>
        </div>
      </UPageCard>

      <UPageCard
        icon="i-lucide-globe"
        :title="t('dashboard.topCountry')"
        :ui="{
          container: 'gap-y-1.5',
          wrapper: 'items-start',
          leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
          title: 'font-normal text-muted text-xs uppercase',
        }"
      >
        <div class="flex items-center gap-2">
          <span class="text-highlighted text-2xl font-semibold">
            {{ topCountry.name }}
          </span>
        </div>
      </UPageCard>
    </UPageGrid>

    <!-- Main Chart -->
    <UCard ref="cardRef" :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }">
      <template #header>
        <div class="flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold">{{ t("dashboard.clickTrend") }}</h3>
            <p class="text-muted-foreground text-sm">{{ t("dashboard.clicksOverTime") }}</p>
          </div>

          <!-- Time Granularity Selector -->
          <USelectMenu v-model="timeGranularity" :items="granularityItems" size="sm" class="w-32" />
        </div>
      </template>

      <div v-if="loading" class="flex h-96 items-center justify-center">
        <UIcon name="i-lucide-loader-2" class="text-muted-foreground size-8 animate-spin" />
      </div>

      <VisXYContainer
        v-else-if="chartData.length > 0"
        :data="chartData"
        :padding="{ top: 40 }"
        class="h-96"
        :width="width"
      >
        <VisLine :x="x" :y="y" color="var(--ui-primary)" />
        <VisArea :x="x" :y="y" color="var(--ui-primary)" :opacity="0.1" />
        <VisAxis type="x" :x="x" :tick-format="xTicks" />
        <VisCrosshair color="var(--ui-primary)" :template="template" />
        <VisTooltip />
      </VisXYContainer>

      <div v-else class="text-muted-foreground flex h-96 items-center justify-center">
        <p>{{ t("common.noData") }}</p>
      </div>
    </UCard>

    <!-- Two Column Layout -->
    <UPageGrid class="gap-6 lg:grid-cols-2">
      <!-- Left: Countries -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">{{ t("dashboard.geoDistribution") }}</h3>
        </template>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-muted-foreground size-6 animate-spin" />
        </div>

        <div v-else-if="countries.length > 0" class="space-y-3">
          <div
            v-for="(country, index) in countries.slice(0, 5)"
            :key="index"
            class="flex items-center gap-3"
          >
            <div class="flex-1">
              <div class="mb-1 flex items-center justify-between">
                <span class="text-sm font-medium">{{
                  country.country || t("common.unknown")
                }}</span>
                <span class="text-muted-foreground text-sm">{{
                  formatNumber(Number(country.clicks))
                }}</span>
              </div>
              <div class="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  class="bg-primary h-full rounded-full transition-all"
                  :style="{ width: `${getPercentage(country)}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-muted-foreground flex items-center justify-center py-12">
          <p>{{ t("common.noData") }}</p>
        </div>
      </UCard>

      <!-- Right: Dimensions -->
      <UCard>
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <h3 class="text-lg font-semibold">{{ t("dashboard.dimensionAnalysis") }}</h3>

            <UFieldGroup>
              <UButton
                :variant="activeTab === 'devices' ? 'solid' : 'outline'"
                size="sm"
                icon="i-lucide-smartphone"
                :title="t('dashboard.devices')"
                @click="setTab('devices')"
              />
              <UButton
                :variant="activeTab === 'browsers' ? 'solid' : 'outline'"
                size="sm"
                icon="i-lucide-globe"
                :title="t('dashboard.browsers')"
                @click="setTab('browsers')"
              />
              <UButton
                :variant="activeTab === 'os' ? 'solid' : 'outline'"
                size="sm"
                icon="i-lucide-monitor"
                :title="t('dashboard.operatingSystems')"
                @click="setTab('os')"
              />
              <UButton
                :variant="activeTab === 'referers' ? 'solid' : 'outline'"
                size="sm"
                icon="i-lucide-link-2"
                :title="t('dashboard.referers')"
                @click="setTab('referers')"
              />
              <UButton
                :variant="activeTab === 'utm_sources' ? 'solid' : 'outline'"
                size="sm"
                icon="i-lucide-tag"
                :title="t('dashboard.utmSources')"
                @click="setTab('utm_sources')"
              />
            </UFieldGroup>
          </div>
        </template>

        <div v-if="loading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="text-muted-foreground size-6 animate-spin" />
        </div>

        <div v-else-if="activeTabData.length > 0" class="space-y-3">
          <div
            v-for="(item, index) in activeTabData.slice(0, 5)"
            :key="index"
            class="flex items-center gap-3"
          >
            <div class="flex-1">
              <div class="mb-1 flex items-center justify-between">
                <span class="flex-1 truncate text-sm font-medium">
                  {{ String(item[activeTabKey] || t("common.unknown")) }}
                </span>
                <span class="text-muted-foreground ml-2 text-sm">
                  {{ formatNumber(Number(item.clicks)) }}
                </span>
              </div>
              <div class="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  class="bg-primary h-full rounded-full transition-all"
                  :style="{ width: `${getPercentage(item)}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-muted-foreground flex items-center justify-center py-12">
          <p>{{ t("common.noData") }}</p>
        </div>
      </UCard>
    </UPageGrid>
  </div>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);
  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);
  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
