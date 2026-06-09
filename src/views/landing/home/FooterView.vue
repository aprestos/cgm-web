<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getTenantEmail, getTenantLogo, tenantStore } from '@/stores/tenant.ts'
import { LogoType } from '@/features/tenant/tenant.model.ts'

const { t } = useI18n()
</script>

<template>
  <footer
    class="border-t border-gray-200 bg-gray-50 py-12 dark:border-white/10 dark:bg-gray-950"
  >
    <div class="mx-auto max-w-7xl px-4">
      <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div class="flex items-center gap-3">
          <img
            v-if="getTenantLogo(LogoType.long)"
            :src="getTenantLogo(LogoType.long)"
            :alt="tenantStore?.name"
            class="h-8 w-auto"
          />
          <span class="text-sm text-gray-500">
            {{
              t('landing.footer.copyright', {
                year: new Date().getFullYear(),
                name: tenantStore?.name,
              })
            }}
          </span>
        </div>

        <div class="flex items-center gap-6 text-sm text-gray-500">
          <a
            v-if="false"
            href="#"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.privacy') }}</a
          >
          <a
            v-if="false"
            href="#"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.terms') }}</a
          >
          <a
            v-if="tenantStore?.email"
            :href="`mailto:${getTenantEmail()}`"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.contact') }}</a
          >
        </div>
      </div>
    </div>
  </footer>
</template>
