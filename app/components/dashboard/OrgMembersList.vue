<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

interface Props {
  members: Array<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
    createdAt: Date;
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | undefined;
    };
  }>;
  canUpdateRole?: boolean;
  canRemove?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canUpdateRole: true,
  canRemove: true,
});

const emit = defineEmits<{
  "update-role": [memberId: string, newRole: string];
  remove: [memberId: string];
}>();

const items = computed<DropdownMenuItem[]>(() => [
  {
    label: "Remove member",
    color: "error" as const,
    onSelect: () => {},
  },
]);
</script>

<template>
  <ul role="list" class="divide-default divide-y">
    <li
      v-for="(member, index) in members"
      :key="index"
      class="flex items-center justify-between gap-3 px-4 py-4 sm:px-6"
    >
      <div class="flex min-w-0 items-center gap-3">
        <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
          <UIcon name="i-lucide-user" class="size-5" />
        </div>

        <div class="min-w-0 text-sm">
          <p class="truncate font-medium">
            {{ member.user.name }}
          </p>
          <p class="text-muted truncate">
            {{ member.user.email }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <USelect
          :model-value="member.role"
          :items="['member', 'admin', 'owner']"
          color="neutral"
          :disabled="!canUpdateRole"
          :ui="{ value: 'capitalize', item: 'capitalize' }"
          @update:model-value="(newRole) => emit('update-role', member.id, newRole)"
        />

        <UButton
          v-if="canRemove"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          :disabled="member.role === 'owner'"
          @click="emit('remove', member.id)"
        />
      </div>
    </li>
  </ul>
</template>
