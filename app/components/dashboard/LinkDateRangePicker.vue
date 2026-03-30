<script setup lang="ts">
import { DateFormatter, getLocalTimeZone, CalendarDate, today } from "@internationalized/date";

const { t } = useI18n();

interface Range {
  start: Date;
  end: Date;
}

const df = new DateFormatter("en-US", {
  dateStyle: "medium",
});

const selected = defineModel<Range>({ required: true });

const ranges = computed(() => [
  { label: t("dashboard.last7Days"), days: 7 },
  { label: t("dashboard.last14Days"), days: 14 },
  { label: t("dashboard.last30Days"), days: 30 },
  { label: t("dashboard.last3Months"), months: 3 },
  { label: t("dashboard.last6Months"), months: 6 },
  { label: t("dashboard.lastYear"), years: 1 },
]);

const toCalendarDate = (date: Date) => {
  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

const calendarRange = computed({
  get: () => ({
    start: selected.value.start ? toCalendarDate(selected.value.start) : undefined,
    end: selected.value.end ? toCalendarDate(selected.value.end) : undefined,
  }),
  set: (newValue: { start: CalendarDate | null; end: CalendarDate | null }) => {
    selected.value = {
      start: newValue.start ? newValue.start.toDate(getLocalTimeZone()) : new Date(),
      end: newValue.end ? newValue.end.toDate(getLocalTimeZone()) : new Date(),
    };
  },
});

const isRangeSelected = (range: { days?: number; months?: number; years?: number }) => {
  if (!selected.value.start || !selected.value.end) return false;

  const currentDate = today(getLocalTimeZone());
  let startDate = currentDate.copy();

  if (range.days) {
    startDate = startDate.subtract({ days: range.days });
  } else if (range.months) {
    startDate = startDate.subtract({ months: range.months });
  } else if (range.years) {
    startDate = startDate.subtract({ years: range.years });
  }

  const selectedStart = toCalendarDate(selected.value.start);
  const selectedEnd = toCalendarDate(selected.value.end);

  return selectedStart.compare(startDate) === 0 && selectedEnd.compare(currentDate) === 0;
};

const selectRange = (range: { days?: number; months?: number; years?: number }) => {
  const endDate = today(getLocalTimeZone());
  let startDate = endDate.copy();

  if (range.days) {
    startDate = startDate.subtract({ days: range.days });
  } else if (range.months) {
    startDate = startDate.subtract({ months: range.months });
  } else if (range.years) {
    startDate = startDate.subtract({ years: range.years });
  }

  // Use same method as manual selection (toDate(getLocalTimeZone()))
  // End date should include the full current day (23:59:59)
  selected.value = {
    start: startDate.toDate(getLocalTimeZone()),
    end: new Date(endDate.toDate(getLocalTimeZone()).setHours(23, 59, 59, 999)),
  };
};
</script>

<template>
  <UPopover :content="{ align: 'start' }" :modal="true">
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar"
      class="data-[state=open]:bg-elevated group"
    >
      <span class="truncate">
        <template v-if="selected.start">
          <template v-if="selected.end">
            {{ df.format(selected.start) }} - {{ df.format(selected.end) }}
          </template>
          <template v-else>
            {{ df.format(selected.start) }}
          </template>
        </template>
        <template v-else> {{ t("dashboard.pickDate") }} </template>
      </span>

      <template #trailing>
        <UIcon
          name="i-lucide-chevron-down"
          class="text-dimmed size-5 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
        />
      </template>
    </UButton>

    <template #content>
      <div class="divide-default flex items-stretch sm:divide-x">
        <div class="hidden flex-col justify-center sm:flex">
          <UButton
            v-for="(range, index) in ranges"
            :key="index"
            :label="range.label"
            color="neutral"
            variant="ghost"
            class="rounded-none px-4"
            :class="[isRangeSelected(range) ? 'bg-elevated' : 'hover:bg-elevated/50']"
            truncate
            @click="selectRange(range)"
          />
        </div>

        <UCalendar v-model="calendarRange" class="p-2" :number-of-months="2" range />
      </div>
    </template>
  </UPopover>
</template>
