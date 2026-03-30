<script setup lang="ts">
import type { Organization } from "better-auth/plugins";

const { t } = useI18n();

interface Props {
  organization: Organization | null;
}

const props = defineProps<Props>();
const toast = useToast();

const emit = defineEmits<{
  refresh: [];
}>();

async function leaveOrganization() {
  if (!props.organization) return;

  const result = await authClient.organization.leave({
    organizationId: props.organization.id,
  });

  if (result.error) {
    toast.add({
      title: t("common.error"),
      description: result.error.message || t("dashboard.failedToLeaveOrg"),
      color: "error",
    });
  } else {
    toast.add({
      title: t("common.success"),
      description: t("dashboard.leftOrg"),
      icon: "i-lucide-check",
      color: "success",
    });

    emit("refresh");
    await navigateTo("/dashboard");
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Delete Organization Section -->
    <UPageCard
      :title="t('admin.deleteOrganization')"
      :description="t('dashboard.confirmDeleteOrgDesc')"
      class="from-error/10 to-default bg-linear-to-tl from-5%"
    >
      <template #footer>
        <DashboardOrgDeleteModal :organization="organization" @refresh="emit('refresh')">
          <UButton :label="t('admin.deleteOrganization')" color="error" icon="i-lucide-trash-2" />
        </DashboardOrgDeleteModal>
      </template>
    </UPageCard>

    <!-- Leave Organization Section -->
    <UPageCard :title="t('dashboard.leaveOrg')" :description="t('dashboard.leaveOrgDesc')">
      <template #footer>
        <UButton
          :label="t('dashboard.leaveOrg')"
          color="neutral"
          variant="outline"
          icon="i-lucide-log-out"
          @click="leaveOrganization"
        />
      </template>
    </UPageCard>
  </div>
</template>
