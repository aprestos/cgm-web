<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

interface Props {
  participants: number
  maxParticipants: number
}

const props = defineProps<Props>()

const { t } = useI18n()

// Above this share of the slots taken the bar warns that spots are running out.
const NEARLY_FULL_PERCENTAGE = 80

const fillPercentage = computed<number>(() => {
  if (!props.maxParticipants) return 0
  return Math.min(
    Math.round((props.participants / props.maxParticipants) * 100),
    100,
  )
})

const isFull = computed<boolean>(
  () => props.participants >= props.maxParticipants,
)

// Indigo while there is room, amber close to the limit, grey once it is full.
const fillClasses = computed<string>(() => {
  if (isFull.value) return 'bg-gray-400 dark:bg-white/30'
  if (fillPercentage.value >= NEARLY_FULL_PERCENTAGE)
    return 'bg-amber-500 dark:bg-amber-400'
  return 'bg-primary-500 dark:bg-primary-400'
})
</script>

<template>
  <div>
    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-white/10"
    >
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="fillClasses"
        :style="{ width: `${fillPercentage}%` }"
      />
    </div>
    <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
      {{
        t('public.tournaments.details.rosterFilled', {
          percentage: fillPercentage,
        })
      }}
    </p>
  </div>
</template>
