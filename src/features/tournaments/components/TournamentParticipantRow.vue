<script setup lang="ts">
/**
 * One line of the participants panel. The same row serves both the sign-ups
 * already saved on the server and the ones staged in the form, so the list
 * reads as a single roster instead of two stacked ones — only the trailing
 * control changes.
 */
import { useI18n } from 'vue-i18n'
import { IconTicket, IconX } from '@tabler/icons-vue'
import CAvatar from '@/components/CAvatar.vue'

interface Props {
  name: string
  initials: string
  /** Backed by a ticket rather than a typed-in name */
  fromTicket?: boolean
  /** Secondary line: the email or the ticket the sign-up came from */
  detail?: string
  /** Saved sign-ups cannot be taken back from here */
  removable?: boolean
}

withDefaults(defineProps<Props>(), {
  fromTicket: false,
  detail: undefined,
  removable: false,
})

const emit = defineEmits<{
  remove: []
}>()

const { t } = useI18n()
</script>

<template>
  <li
    class="flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 ring-1 ring-gray-200 dark:bg-white/5 dark:ring-white/10"
  >
    <CAvatar
      size="sm"
      shape="circle"
      :initials="initials"
      :alt="name"
      class="shrink-0"
    />

    <span class="min-w-0 flex-1">
      <span
        class="block truncate text-sm font-medium text-gray-900 dark:text-white"
        :title="name"
      >
        {{ name }}
      </span>
      <span
        v-if="detail"
        class="block truncate text-xs text-gray-500 dark:text-gray-400"
      >
        {{ detail }}
      </span>
    </span>

    <IconTicket
      v-if="fromTicket && !removable"
      class="size-4 shrink-0 text-primary-500 dark:text-primary-400"
      :aria-label="t('public.tournaments.fromTicket')"
    />

    <button
      v-if="removable"
      type="button"
      class="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
      :aria-label="t('public.tournaments.joinDialog.removePerson')"
      @click="emit('remove')"
    >
      <IconX class="size-4" />
    </button>
  </li>
</template>

<style scoped></style>
