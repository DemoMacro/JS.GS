<script setup lang="ts">
import type { Invitation } from "better-auth/plugins";

import { authClient } from "~/utils/auth";

definePageMeta({
  title: "Invitations - Settings - Dashboard - JS.GS",
});

const toast = useToast();

const loading = ref(true);

// listUserInvitations returns invitations with organizationName instead of organization
type UserInvitation = Omit<Invitation, "organization"> & {
  organizationName: string;
};

const invitations = ref<UserInvitation[]>([]);

// Fetch user's invitations
async function fetchInvitations() {
  loading.value = true;
  try {
    const result = await authClient.organization.listUserInvitations();
    if (result.error) {
      throw new Error(result.error.message);
    }
    invitations.value = result.data || [];
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to fetch invitations",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Accept invitation
async function acceptInvitation(invitationId: string) {
  try {
    const result = await authClient.organization.acceptInvitation({
      invitationId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    toast.add({
      title: "Success",
      description: "Invitation accepted successfully",
      color: "success",
    });

    await fetchInvitations();
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to accept invitation",
      color: "error",
    });
  }
}

// Decline invitation
async function declineInvitation(invitationId: string) {
  try {
    const result = await authClient.organization.rejectInvitation({
      invitationId,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    toast.add({
      title: "Success",
      description: "Invitation declined",
      color: "success",
    });

    await fetchInvitations();
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.message || "Failed to decline invitation",
      color: "error",
    });
  }
}

// Initial fetch
onMounted(() => {
  fetchInvitations();
});

// Format date
function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
</script>

<template>
  <div class="space-y-6">
    <!-- Invitations List Card -->
    <UPageCard
      variant="subtle"
      :ui="{
        container: 'p-0 sm:p-0 gap-y-0',
        wrapper: 'items-stretch',
        header: 'p-4 mb-0 border-b border-default',
      }"
    >
      <template #header>
        <div class="flex w-full items-center justify-between">
          <h3 class="text-lg font-semibold">Organization Invitations</h3>
          <UButton
            icon="i-lucide-refresh-ccw"
            variant="ghost"
            size="sm"
            :loading="loading"
            @click="fetchInvitations"
          />
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="loading && invitations.length === 0" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
      </div>

      <!-- Empty State -->
      <div v-else-if="invitations.length === 0" class="py-8 text-center">
        <UIcon name="i-lucide-mail" class="text-muted mx-auto mb-4 size-12" />
        <h3 class="mb-2 text-lg font-semibold">No invitations</h3>
        <p class="text-muted text-sm">You don't have any organization invitations.</p>
      </div>

      <!-- Invitations List -->
      <ul v-else role="list" class="divide-default divide-y">
        <li
          v-for="(invitation, index) in invitations"
          :key="index"
          class="flex items-center justify-between gap-3 px-4 py-4 sm:px-6"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <UIcon name="i-lucide-building-2" class="size-5" />
            </div>

            <div class="min-w-0 text-sm">
              <p class="truncate font-medium">
                {{ invitation.organizationName }}
              </p>
              <p class="text-muted truncate">
                Role: {{ invitation.role }} • Invited: {{ formatDate(invitation.createdAt) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UBadge
              :color="
                invitation.status === 'accepted'
                  ? 'success'
                  : invitation.status === 'rejected'
                    ? 'error'
                    : 'neutral'
              "
              variant="subtle"
              size="sm"
            >
              {{ invitation.status }}
            </UBadge>

            <template v-if="invitation.status === 'pending'">
              <UButton
                size="xs"
                color="error"
                variant="outline"
                @click="declineInvitation(invitation.id)"
              >
                Decline
              </UButton>
              <UButton size="xs" @click="acceptInvitation(invitation.id)"> Accept </UButton>
            </template>
          </div>
        </li>
      </ul>
    </UPageCard>
  </div>
</template>
