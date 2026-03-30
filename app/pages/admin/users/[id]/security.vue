<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

const { t } = useI18n();

const route = useRoute();
const userId = route.params.id as string;
const toast = useToast();

// Use composable for user data
const { user, loading, updateUser, banUser, unbanUser, removeUser } = useUser(userId);

// Password form schema
const passwordSchema = z
  .object({
    newPassword: z.string().min(8, t("auth.passwordMin8")),
    confirmPassword: z.string().min(8, t("admin.pleaseConfirmPassword")),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t("auth.passwordsDontMatch"),
    path: ["confirmPassword"],
  });

type PasswordSchema = z.output<typeof passwordSchema>;

// Password form state
const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

// Ban form state
const banForm = reactive({
  reason: "",
  expiresIn: 60 * 60 * 24 * 7, // 7 days
});

// Ban form schema
const banSchema = z.object({
  reason: z.string().min(1, t("admin.banReasonRequired")),
  expiresIn: z.number().min(0, t("admin.mustBePositive")),
});

type BanSchema = z.output<typeof banSchema>;

// Modals state
const showBanModal = ref(false);
const showDeleteModal = ref(false);

// Sessions data
const sessions = ref<any[]>([]);
const sessionsLoading = ref(false);

// Update password
async function onSubmitPassword(event: FormSubmitEvent<PasswordSchema>) {
  if (!user.value) return;

  try {
    await updateUser({
      newPassword: event.data.newPassword,
    });

    toast.add({
      title: t("common.success"),
      description: t("admin.passwordUpdated"),
      icon: "i-lucide-check",
      color: "success",
    });

    // Reset form
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("admin.failedToUpdatePassword"),
      color: "error",
    });
  }
}

// Handle ban user
const onSubmitBan = async (event: FormSubmitEvent<BanSchema>) => {
  if (!user.value) return;

  try {
    await banUser(event.data.reason, event.data.expiresIn);
    toast.add({
      title: t("common.success"),
      description:
        event.data.expiresIn > 0
          ? t("admin.userBannedDays", { days: Math.floor(event.data.expiresIn / (60 * 60 * 24)) })
          : t("admin.userBanned"),
      color: "success",
    });

    // Reset ban form
    banForm.reason = "";
    banForm.expiresIn = 60 * 60 * 24 * 7;
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("admin.failedToBanUser"),
      color: "error",
    });
  }
};

// Handle unban user
const handleUnbanUser = async () => {
  if (!user.value) return;

  try {
    await unbanUser();
    toast.add({
      title: t("common.success"),
      description: t("admin.userUnbanned"),
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("admin.failedToUnbanUser"),
      color: "error",
    });
  }
};

// Handle delete user
const handleDeleteUser = async () => {
  if (!user.value) return;

  try {
    await removeUser();
    toast.add({
      title: t("common.success"),
      description: t("admin.userRemoved"),
      color: "success",
    });

    // Redirect back to users list
    await navigateTo("/admin/users");
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("admin.failedToRemoveUser"),
      color: "error",
    });
  }
};

// Fetch user sessions
async function fetchUserSessions() {
  if (!user.value) return;

  sessionsLoading.value = true;
  try {
    const result = await authClient.admin.listUserSessions({
      userId: user.value.id,
    });

    if (result.data?.sessions) {
      sessions.value = result.data.sessions;
    }
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("admin.failedToFetchSessions"),
      color: "error",
    });
  } finally {
    sessionsLoading.value = false;
  }
}

// Revoke session
async function revokeSession(sessionId: string) {
  try {
    toast.add({
      title: t("admin.info"),
      description: t("admin.revokeIndividualRequiresToken"),
      color: "info",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("admin.failedToRevokeSessions"),
      color: "error",
    });
  }
}

// Revoke all sessions
async function revokeAllSessions() {
  if (!user.value) return;

  try {
    const result = await authClient.admin.revokeUserSessions({
      userId: user.value.id,
    });

    if (result.error) {
      toast.add({
        title: t("common.error"),
        description: result.error.message || t("admin.failedToRevokeSessions"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("admin.allSessionsRevoked"),
      color: "success",
    });

    // Refresh sessions
    await fetchUserSessions();
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("admin.failedToRevokeSessions"),
      color: "error",
    });
  }
}

// Format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

// Get session status
function getSessionStatus(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  return expiry > now;
}

// Auto-fetch sessions on mount when user data is loaded
onMounted(() => {
  if (user.value) {
    fetchUserSessions();
  }
});
</script>

<template>
  <div v-if="loading" class="flex h-64 items-center justify-center">
    <UIcon name="i-lucide-loader-2" class="size-8 animate-spin" />
  </div>

  <div v-else-if="!user" class="py-8 text-center">
    <h3 class="text-muted-foreground mb-2 text-lg font-semibold">{{ t("admin.userNotFound") }}</h3>
    <p class="text-muted-foreground mb-4">
      {{ t("admin.userNotFoundDesc") }}
    </p>
    <UButton to="/admin/users">{{ t("admin.backToUsers") }}</UButton>
  </div>

  <div v-else>
    <UPageCard
      :title="t('admin.updatePassword')"
      :description="t('admin.updatePasswordDesc')"
      variant="subtle"
    >
      <UForm
        :schema="passwordSchema"
        :state="passwordForm"
        @submit="onSubmitPassword"
        class="space-y-4"
      >
        <UFormField
          name="newPassword"
          :label="t('admin.newPassword')"
          :description="t('admin.enterNewPasswordDesc')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput v-model="passwordForm.newPassword" type="password" autocomplete="new-password" />
        </UFormField>
        <USeparator />
        <UFormField
          name="confirmPassword"
          :label="t('auth.confirmPassword')"
          :description="t('admin.confirmNewPasswordDesc')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
          />
        </UFormField>
        <USeparator />
        <div class="flex justify-end pt-4">
          <UButton type="submit" color="primary"> {{ t("admin.updatePasswordBtn") }} </UButton>
        </div>
      </UForm>
    </UPageCard>

    <!-- Sessions Section -->
    <UPageCard
      :title="t('admin.sessions')"
      :description="t('admin.manageSessionsDesc')"
      variant="subtle"
      class="mt-6"
    >
      <div class="mb-4 flex items-center justify-between">
        <div class="text-muted-foreground text-sm">
          {{ sessions.filter((s) => getSessionStatus(s.expiresAt)).length }}
          {{ t("common.active").toLowerCase() }} {{ t("admin.sessions").toLowerCase() }}
        </div>
        <UButton
          variant="outline"
          size="sm"
          @click="revokeAllSessions"
          :disabled="sessions.length === 0"
        >
          <UIcon name="i-lucide-power" class="mr-2 size-4" />
          {{ t("admin.revokeAll") }}
        </UButton>
      </div>

      <div v-if="sessionsLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
      </div>

      <div v-else-if="sessions.length === 0" class="py-8 text-center">
        <UIcon name="i-lucide-key-round" class="text-muted-foreground mx-auto mb-4 size-12" />
        <h3 class="text-muted-foreground mb-2 text-lg font-semibold">
          {{ t("admin.noSessionsFound") }}
        </h3>
        <p class="text-muted-foreground">{{ t("admin.noSessionsUserDesc") }}</p>
      </div>

      <div v-else class="space-y-3">
        <UCard
          v-for="session in sessions"
          :key="session.id"
          class="p-0"
          :class="getSessionStatus(session.expiresAt) ? 'bg-background' : 'bg-muted/30'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-monitor" class="text-muted-foreground size-4" />
              <div>
                <div class="text-sm font-medium">
                  {{ t("admin.sessionLabel", { id: session.id.slice(-8) }) }}
                </div>
                <div class="text-muted-foreground text-xs">
                  {{ t("common.created") }}: {{ formatDate(session.createdAt) }} •
                  {{ t("common.expires") }}:
                  {{ formatDate(session.expiresAt) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="getSessionStatus(session.expiresAt) ? 'success' : 'secondary'"
                variant="soft"
                size="sm"
              >
                {{ getSessionStatus(session.expiresAt) ? t("common.active") : t("common.expired") }}
              </UBadge>
              <UButton
                v-if="getSessionStatus(session.expiresAt)"
                variant="ghost"
                size="sm"
                color="error"
                @click="revokeSession(session.id)"
              >
                <UIcon name="i-lucide-power" class="size-4" />
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UPageCard>

    <UPageCard
      :title="t('admin.manageAccountDesc')"
      class="from-error/10 to-default mt-6 bg-gradient-to-tl from-5%"
    >
      <div class="space-y-4">
        <!-- Ban Status and Actions -->
        <div
          v-if="user.banned"
          class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-circle" class="mt-0.5 size-5 text-red-500" />
            <div class="flex-1">
              <p class="font-medium text-red-900 dark:text-red-100">{{ t("admin.userBanned") }}</p>
              <p v-if="user.banReason" class="mt-1 text-sm text-red-700 dark:text-red-300">
                {{ t("admin.banReasonLabel") }} {{ user.banReason }}
              </p>
              <p v-if="user.banExpires" class="mt-1 text-sm text-red-700 dark:text-red-300">
                {{ t("common.expires") }}: {{ new Date(user.banExpires).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="flex flex-wrap gap-3">
          <UButton v-if="!user.banned" @click="showBanModal = true" color="error" variant="outline">
            <UIcon name="i-lucide-ban" class="mr-2" />
            {{ t("admin.banUser") }}
          </UButton>
          <UButton v-else @click="handleUnbanUser" color="success" variant="outline">
            <UIcon name="i-lucide-user-check" class="mr-2" />
            {{ t("admin.unbanUser") }}
          </UButton>
          <DashboardUserDeleteModal :user="user">
            <UButton :label="t('common.delete')" color="error" />
          </DashboardUserDeleteModal>
        </div>
      </div>
    </UPageCard>

    <!-- Ban Modal -->
    <UModal v-model="showBanModal" :title="t('admin.banUser')">
      <template #body>
        <UForm :schema="banSchema" :state="banForm" @submit="onSubmitBan" class="space-y-4">
          <UFormField
            name="reason"
            :label="t('admin.banReason')"
            :description="t('admin.banReasonDesc')"
            required
          >
            <UTextarea
              v-model="banForm.reason"
              :placeholder="t('admin.banReasonPlaceholder')"
              :rows="3"
            />
          </UFormField>
          <UFormField
            name="expiresIn"
            :label="t('admin.banDuration')"
            :description="t('admin.banDurationDesc')"
          >
            <USelect
              v-model="banForm.expiresIn"
              :items="[
                { label: t('admin.permanent'), value: 0 },
                { label: t('admin.1hour'), value: 3600 },
                { label: t('admin.1day'), value: 86400 },
                { label: t('admin.1week'), value: 604800 },
                { label: t('admin.1month'), value: 2592000 },
              ]"
            />
          </UFormField>
          <div class="flex justify-end gap-3 pt-4">
            <UButton variant="outline" @click="showBanModal = false">
              {{ t("common.cancel") }}
            </UButton>
            <UButton type="submit" color="error"> {{ t("admin.banUser") }} </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model="showDeleteModal" :title="t('admin.deleteUser')">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-triangle" class="mt-0.5 size-5 text-red-500" />
            <div class="flex-1">
              <p class="font-medium text-red-900">{{ t("admin.deleteUser") }}</p>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ t("admin.deleteUserConfirm", { name: user.name || user.email }) }}
              </p>
              <p class="text-muted-foreground mt-1 text-sm">
                {{ t("admin.cannotBeUndone") }}
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <UButton variant="outline" @click="showDeleteModal = false">
              {{ t("common.cancel") }}
            </UButton>
            <UButton color="error" @click="handleDeleteUser"> {{ t("admin.deleteUser") }} </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
