<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTenantStore } from '@/features/tenant/tenant.store'
import CongremLogo from '@/components/CongremLogo.vue'

const tenantStore = useTenantStore()

const { t } = useI18n()
</script>

<template>
  <footer class="border-t border-gray-200 py-12 dark:border-white/10">
    <div class="mx-auto max-w-7xl px-4">
      <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <!--
          The platform's mark, not the tenant's: the convention's own logo is
          already in the header, and the footer is where the page says what it
          runs on. It is monochrome here — `currentColor` takes the grey of the
          copyright beside it — because the Congrem green identifies Congrem
          and never a tenant, and the mark is never recoloured to a tenant's
          brand colour either. `h-9` rather than `h-8`: the lockup's minimum is
          130px wide, which 32px of height falls just short of.
        -->
        <div class="flex items-center gap-3 text-gray-500">
          <CongremLogo class="h-9 w-auto" />
          <span class="text-sm">
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
