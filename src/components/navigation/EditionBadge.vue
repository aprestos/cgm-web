<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconCalendarEvent } from '@tabler/icons-vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { LogoType } from '@/features/tenant/tenant.model.ts'
import { useEditionStore } from '@/features/events/edition.store'
import { formatDateRange } from '@/utils/date.ts'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()

/**
 * Which event edition the dashboard is currently showing: the tenant mark, the
 * edition name and the dates it runs. Lives in the sidebar header on desktop
 * and in the top bar on mobile, so both are fed by the same block instead of
 * each assembling the stores their own way.
 */
withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })

const { locale } = useI18n()

const logo = computed(() => tenantStore.getLogo(LogoType.square))

// Before an edition is loaded (or on a tenant that has none) the organization
// name still names the place the user is in.
const title = computed(
  () => editionStore.edition?.name || tenantStore.tenant?.name || '',
)

// formatDateRange answers '-' when either end is missing; an empty line reads
// better than a stray dash under the name.
const dateRange = computed(() => {
  const range = formatDateRange(
    editionStore.edition?.start_date,
    editionStore.edition?.end_date,
    locale.value,
  )
  return range === '-' ? '' : range
})
</script>

<template>
  <div
    class="flex min-w-0 items-center"
    :class="size === 'sm' ? 'gap-x-2.5' : 'gap-x-3'"
  >
    <img
      v-if="logo"
      :src="logo"
      alt=""
      aria-hidden="true"
      class="w-auto shrink-0 object-contain"
      :class="size === 'sm' ? 'h-8' : 'h-10'"
    />
    <div class="min-w-0">
      <p
        class="truncate font-display font-bold leading-tight text-gray-900 dark:text-white"
        :class="size === 'sm' ? 'text-sm' : 'text-base'"
      >
        {{ title }}
      </p>
      <p
        v-if="dateRange"
        class="mt-0.5 flex items-center gap-x-1 text-gray-500 dark:text-gray-400"
        :class="size === 'sm' ? 'text-[11px]' : 'text-xs'"
      >
        <IconCalendarEvent class="size-3.5 shrink-0" aria-hidden="true" />
        <span class="truncate">{{ dateRange }}</span>
      </p>
    </div>
  </div>
</template>
