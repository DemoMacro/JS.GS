<script setup lang="ts">
import type { Domain } from "~~/shared/types/domain";

import { authClient } from "~/utils/auth";

const { t } = useI18n();

const props = defineProps<{
  domain: Domain | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const { copy, copied, isSupported } = useClipboard();

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: t("common.success"),
      description: t("dashboard.verificationTokenCopied"),
      color: "success",
    });
  }
});

async function copyToken(token: string) {
  if (!isSupported.value) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.clipboardNotSupported"),
      color: "error",
    });
    return;
  }

  await copy(token);
}

async function verifyDomain() {
  if (!props.domain?.id) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.domainIdRequired"),
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.domain.verify({
      domainId: props.domain.id,
    });

    if (result.error) {
      toast.add({
        title: t("dashboard.verificationFailed"),
        description: result.error.message || t("dashboard.verificationFailedDesc"),
        color: "error",
      });
      return;
    }

    toast.add({
      title: t("common.success"),
      description: `Domain ${props.domain.domainName} has been verified successfully!`,
      color: "success",
    });

    emit("refresh");
    open.value = false;
  } catch (error) {
    toast.add({
      title: t("common.error"),
      description: t("dashboard.verificationError"),
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('dashboard.verifyDomainOwnership')"
    :description="t('dashboard.verifyDomainViaDns')"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="domain"
          color="neutral"
          icon="i-lucide-info"
          :title="t('dashboard.dnsTxtConfig')"
          :description="t('dashboard.addDnsRecord')"
        >
          <template #body>
            <div class="mt-4 space-y-3">
              <div class="flex items-start gap-3">
                <span class="min-w-16 text-sm font-medium">{{ t("dashboard.type") }}</span>
                <UBadge variant="subtle">TXT</UBadge>
              </div>
              <div class="flex items-start gap-3">
                <span class="min-w-16 text-sm font-medium">{{ t("dashboard.hostName") }}</span>
                <span class="font-mono text-sm">@</span>
                <span class="text-muted-foreground text-xs">(or {{ domain.domainName }})</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="min-w-16 text-sm font-medium">{{ t("dashboard.value") }}</span>
                <div class="flex flex-1 items-center gap-2">
                  <span class="font-mono text-sm break-all">
                    {{ domain.verificationToken }}
                  </span>
                  <UButton
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-copy"
                    @click="copyToken(domain.verificationToken || '')"
                  />
                </div>
              </div>
            </div>
          </template>
        </UAlert>

        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="open = false" :disabled="loading">
            {{ t("common.cancel") }}
          </UButton>
          <UButton color="primary" :loading="loading" @click="verifyDomain">
            <template #leading>
              <UIcon name="i-lucide-check" />
            </template>
            {{ t("dashboard.verifyDomain") }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
