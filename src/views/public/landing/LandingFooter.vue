<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  tenantLogo?: string
  tenantName?: string
}

defineProps<Props>()
</script>

<template>
  <footer
    class="border-t border-gray-200 dark:border-white/10 bg-white dark:bg-gray-950 py-12"
  >
    <div class="mx-auto max-w-7xl px-4">
      <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div class="flex items-center gap-3">
          <img
            v-if="tenantLogo"
            :src="tenantLogo"
            :alt="tenantName"
            class="h-8 w-auto"
          />
          <span class="text-sm text-gray-500">
            {{
              t('landing.footer.copyright', {
                year: new Date().getFullYear(),
                name: tenantName,
              })
            }}
          </span>
        </div>

        <div class="flex items-center gap-6 text-sm text-gray-500">
          <a
            href="#"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.privacy') }}</a
          >
          <a
            href="#"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.terms') }}</a
          >
          <a
            href="#"
            class="transition-colors hover:text-gray-900 dark:hover:text-white"
            >{{ t('landing.footer.contact') }}</a
          >
        </div>
      </div>
    </div>
  </footer>
</template>
