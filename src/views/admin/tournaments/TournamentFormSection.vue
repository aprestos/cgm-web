<script setup lang="ts">
import { ref, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { IconChevronRight } from '@tabler/icons-vue'

interface Props {
  title?: string
  /** Marks the group as optional and, on a disclosure, keeps it shut at first. */
  optional?: boolean
  /** Folds the group away behind its heading. */
  collapsible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  optional: false,
  collapsible: false,
})

const { t } = useI18n()

const bodyId = useId()

const isOpen = ref<boolean>(!props.collapsible)

const toggle = (): void => {
  if (!props.collapsible) return
  isOpen.value = !isOpen.value
}
</script>

<template>
  <section
    class="border-t border-gray-100 pt-5 first:border-t-0 first:pt-0 dark:border-white/10"
  >
    <!-- Collapsible groups swap the heading for the disclosure button so both
         kinds of section keep the same silhouette down the form. -->
    <component
      :is="collapsible ? 'button' : 'h4'"
      :type="collapsible ? 'button' : undefined"
      :aria-expanded="collapsible ? isOpen : undefined"
      :aria-controls="collapsible ? bodyId : undefined"
      class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
      :class="
        collapsible
          ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200'
          : ''
      "
      @click="toggle"
    >
      <IconChevronRight
        v-if="collapsible"
        class="size-4 transition-transform"
        :class="isOpen ? 'rotate-90' : ''"
        aria-hidden="true"
      />
      {{ title }}
      <span
        v-if="optional"
        class="font-normal normal-case tracking-normal text-gray-400 dark:text-gray-500"
      >
        ({{ t('common.actions.optional') }})
      </span>
    </component>

    <div v-show="isOpen" :id="bodyId" class="mt-4">
      <slot />
    </div>
  </section>
</template>
