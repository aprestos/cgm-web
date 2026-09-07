<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { LogoType } from '@/features/tenant/tenant.model.ts'

const tenantStore = useTenantStore()

const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-gray-200 py-12 dark:border-white/10">
    <div class="mx-auto max-w-7xl px-4">
      <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div class="flex items-center gap-3">
          <img
            v-if="tenantStore.getLogo(LogoType.long)"
            :src="tenantStore.getLogo(LogoType.long)"
            :alt="tenantStore.tenant?.name"
            class="h-8 w-auto"
          />
          <span class="text-sm text-gray-500">
            {{
              t('landing.footer.copyright', {
                year: new Date().getFullYear(),
                name: tenantStore.tenant?.name,
              })
            }}
          </span>
        </div>

        <div class="flex items-center gap-6 text-sm text-gray-500">
          <!-- Privacy/Terms links intentionally omitted until URLs are available -->
          <a
            v-if="tenantStore.tenant?.email"
            :href="`mailto:${tenantStore.getEmail()}`"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.contact') }}</a
          >
        </div>
      </div>
    </div>
  </footer>
</template>
