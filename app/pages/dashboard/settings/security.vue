<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

definePageMeta({
  layout: "dashboard",
});

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Password change schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, t("dashboard.enterCurrentPassword")),
    newPassword: z.string().min(8, t("dashboard.passwordMin8")),
    confirmPassword: z.string().min(1, t("dashboard.pleaseConfirmPassword")),
    revokeOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: t("dashboard.passwordsDontMatch"),
    path: ["confirmPassword"],
  });

type PasswordSchema = z.output<typeof passwordSchema>;

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  revokeOtherSessions: true,
});

const passwordLoading = ref(false);

// Change password handler
const onPasswordSubmit = async (event: FormSubmitEvent<PasswordSchema>) => {
  passwordLoading.value = true;
  try {
    const { data, error } = await authClient.changePassword({
      currentPassword: event.data.currentPassword,
      newPassword: event.data.newPassword,
      revokeOtherSessions: event.data.revokeOtherSessions ?? true,
    });

    if (error) {
      toast.add({
        title: t("common.error"),
        description: error.message || t("dashboard.failedToChangePassword"),
        color: "error",
      });
      return;
    }

    // Reset form
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    };

    toast.add({
      title: t("common.success"),
      description: t("dashboard.passwordChanged"),
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : t("dashboard.failedToChangePassword"),
      color: "error",
    });
  } finally {
    passwordLoading.value = false;
  }
};

// Sessions management
const sessionsLoading = ref(false);
const sessions = ref<any[]>([]);

// Fetch active sessions
async function fetchSessions() {
  sessionsLoading.value = true;
  try {
    const { data: sessionsData } = await authClient.listSessions();

    sessions.value = sessionsData || [];
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : "Failed to fetch sessions",
      color: "error",
    });
  } finally {
    sessionsLoading.value = false;
  }
}

// Revoke specific session
async function revokeSession(token: string) {
  try {
    await authClient.revokeSession({ token });

    toast.add({
      title: t("common.success"),
      description: t("dashboard.sessionRevoked"),
      icon: "i-lucide-check",
      color: "success",
    });

    // Refresh sessions list
    await fetchSessions();
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: error instanceof Error ? error.message : "Failed to revoke session",
      color: "error",
    });
  }
}

// Revoke all other sessions
async function revokeAllOtherSessions() {
  try {
    // Get current session token to exclude it
    const currentSessionToken = session.value?.session?.token;
    if (!currentSessionToken) {
      toast.add({
        title: t("common.error"),
        description: t("dashboard.sessionNotFound"),
        color: "error",
      });
      return;
    }

    // Revoke all sessions except current one by one
    const revokePromises = sessions.value
      .filter((s) => s.token !== currentSessionToken)
      .map((s) => authClient.revokeSession({ token: s.token }));

    await Promise.all(revokePromises);

    toast.add({
      title: t("common.success"),
      description: t("dashboard.allSessionsRevoked"),
      icon: "i-lucide-check",
      color: "success",
    });

    // Refresh sessions list
    await fetchSessions();
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.failedToRevokeSessions"),
      color: "error",
    });
  }
}

// Delete account
const deleteAccountModalOpen = ref(false);
const deleteAccountLoading = ref(false);
const deletePassword = ref("");

const deleteAccountSchema = z.object({
  password: z.string().min(1, t("common.password")),
});

const deleteAccountForm = reactive({
  password: "",
});

async function deleteAccount() {
  deleteAccountLoading.value = true;
  try {
    const { error } = await authClient.deleteUser({
      password: deleteAccountForm.password,
    });

    if (error) {
      toast.add({
        title: t("common.error"),
        description: error.message || "Failed to delete account",
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: t("dashboard.accountDeleted"),
      color: "success",
    });

    deleteAccountModalOpen.value = false;
    deleteAccountForm.password = "";

    // Redirect to home page
    await navigateTo("/");
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("common.unexpectedError"),
      color: "error",
    });
  } finally {
    deleteAccountLoading.value = false;
  }
}

// Format date
function formatDate(dateString: string | undefined) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString();
}

// Get session status
function getSessionStatus(expiresAt: string | undefined) {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  return expiry > now;
}

// Fetch sessions on mount
onMounted(() => {
  fetchSessions();
});
</script>

<template>
  <div v-if="!session?.user" class="py-8 text-center">
    <h3 class="mb-2 text-lg font-semibold">{{ t("common.notAuthenticated") }}</h3>
    <p class="mb-4">{{ t("dashboard.pleaseSignInSecurity") }}</p>
    <UButton to="/auth/sign-in">{{ t("common.signIn") }}</UButton>
  </div>

  <div v-else class="space-y-6">
    <!-- Password Section -->
    <UPageCard
      :title="t('dashboard.changePassword')"
      :description="t('dashboard.changePasswordDesc')"
      variant="subtle"
    >
      <UForm
        :schema="passwordSchema"
        :state="passwordForm"
        @submit="onPasswordSubmit"
        class="space-y-4"
      >
        <UFormField
          name="currentPassword"
          :label="t('dashboard.currentPassword')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput
            v-model="passwordForm.currentPassword"
            type="password"
            :placeholder="t('dashboard.enterCurrentPassword')"
            autocomplete="current-password"
          />
        </UFormField>
        <UFormField
          name="newPassword"
          :label="t('dashboard.newPassword')"
          :description="t('dashboard.passwordHint')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput
            v-model="passwordForm.newPassword"
            type="password"
            :placeholder="t('dashboard.enterNewPassword')"
            autocomplete="new-password"
          />
        </UFormField>
        <UFormField
          name="confirmPassword"
          :label="t('dashboard.confirmNewPassword')"
          :description="t('dashboard.confirmNewPasswordPlaceholder')"
          required
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UInput
            v-model="passwordForm.confirmPassword"
            type="password"
            :placeholder="t('dashboard.confirmNewPasswordPlaceholder')"
            autocomplete="new-password"
          />
        </UFormField>
        <UFormField
          name="revokeOtherSessions"
          :label="t('dashboard.revokeOtherSessions')"
          :description="t('dashboard.signOutOtherDevices')"
          class="flex items-start justify-between gap-4 max-sm:flex-col"
        >
          <UCheckbox v-model="passwordForm.revokeOtherSessions" />
        </UFormField>

        <div class="flex justify-start pt-4">
          <UButton type="submit" :loading="passwordLoading">
            {{ t("dashboard.changePassword") }}
          </UButton>
        </div>
      </UForm>
    </UPageCard>

    <!-- Sessions Section -->
    <UPageCard
      variant="subtle"
      :ui="{
        container: 'p-0 sm:p-0 gap-y-0',
        wrapper: 'items-stretch',
        header: 'p-4 mb-0 border-b border-default',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="text-muted text-sm">
            {{
              t("dashboard.activeSessionsCount", {
                count: sessions.filter((s) => getSessionStatus(s.expiresAt)).length,
              })
            }}
          </div>
          <UButton
            variant="outline"
            size="sm"
            @click="revokeAllOtherSessions"
            :disabled="sessions.length <= 1"
          >
            <UIcon name="i-lucide-power" class="mr-2 size-4" />
            {{ t("dashboard.revokeAllSessions") }}
          </UButton>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="sessionsLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
      </div>

      <!-- Empty State -->
      <div v-else-if="sessions.length === 0" class="py-8 text-center">
        <UIcon name="i-lucide-key-round" class="text-muted mx-auto mb-4 size-12" />
        <h3 class="mb-2 text-lg font-semibold">{{ t("dashboard.noSessions") }}</h3>
        <p class="text-muted text-sm">{{ t("dashboard.noSessionsDesc") }}</p>
      </div>

      <!-- Sessions List -->
      <ul v-else role="list" class="divide-default divide-y">
        <li
          v-for="sessionItem in sessions"
          :key="sessionItem.token"
          class="flex items-center justify-between gap-3 px-4 py-4 sm:px-6"
        >
          <div class="flex min-w-0 items-center gap-3">
            <div class="bg-primary/10 flex size-10 items-center justify-center rounded-full">
              <UIcon name="i-lucide-monitor" class="size-5" />
            </div>

            <div class="min-w-0 text-sm">
              <p class="truncate font-medium">Session {{ sessionItem.token.slice(-8) }}</p>
              <p class="text-muted truncate">
                {{ t("common.created") }}: {{ formatDate(sessionItem.createdAt) }} •
                {{ t("common.expires") }}:
                {{ formatDate(sessionItem.expiresAt) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UBadge
              :color="getSessionStatus(sessionItem.expiresAt) ? 'success' : 'secondary'"
              variant="soft"
            >
              {{
                getSessionStatus(sessionItem.expiresAt) ? t("common.active") : t("common.expired")
              }}
            </UBadge>

            <UButton
              v-if="getSessionStatus(sessionItem.expiresAt)"
              icon="i-lucide-power"
              color="error"
              variant="ghost"
              size="sm"
              @click="revokeSession(sessionItem.token)"
            />
          </div>
        </li>
      </ul>
    </UPageCard>

    <!-- Delete Account Section -->
    <UPageCard
      :title="t('dashboard.deleteAccount')"
      :description="t('dashboard.deleteAccountDesc')"
      class="from-error/10 to-default bg-linear-to-tl from-5%"
    >
      <template #footer>
        <UButton color="error" @click="deleteAccountModalOpen = true">
          {{ t("dashboard.deleteAccount") }}
        </UButton>
      </template>
    </UPageCard>

    <!-- Delete Account Modal -->
    <UModal
      v-model:open="deleteAccountModalOpen"
      :title="t('dashboard.deleteAccount')"
      :description="t('dashboard.cannotBeUndone')"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="error"
            variant="subtle"
            :title="t('common.warning')"
            :description="t('dashboard.deleteAccountWarning')"
          />

          <UForm
            :schema="deleteAccountSchema"
            :state="deleteAccountForm"
            class="space-y-4"
            @submit="deleteAccount"
          >
            <UFormField
              name="password"
              :label="t('common.password')"
              :description="t('dashboard.enterPasswordToDelete')"
            >
              <UInput
                v-model="deleteAccountForm.password"
                type="password"
                :placeholder="t('dashboard.enterCurrentPassword')"
                autocomplete="current-password"
                :disabled="deleteAccountLoading"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-2">
              <UButton
                variant="outline"
                @click="deleteAccountModalOpen = false"
                :disabled="deleteAccountLoading"
              >
                {{ t("common.cancel") }}
              </UButton>
              <UButton
                color="error"
                type="submit"
                :loading="deleteAccountLoading"
                :disabled="!deleteAccountForm.password"
              >
                {{ t("dashboard.deleteAccount") }}
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>
