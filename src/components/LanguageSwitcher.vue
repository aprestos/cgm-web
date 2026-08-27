<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { IconCheck, IconLanguage } from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'

const { availableLocales, currentLocale, setLocale } = useLocale()

const handleLocaleChange = (localeCode: string): void => {
  setLocale(localeCode)
}
</script>

<template>
  <Listbox
    :model-value="currentLocale?.code"
    @update:model-value="handleLocaleChange"
  >
    <div class="relative">
      <ListboxButton
        class="relative flex flex-row items-center w-full cursor-default text-base sm:text-sm/6 text-gray-900 dark:text-white focus:ring-0 bg-transparent outline-none"
      >
        <CButton variant="transparent">
          <IconLanguage class="size-5 mr-1" />
          <span class="hidden md:block">{{
            currentLocale?.nativeName
          }}</span></CButton
        >
      </ListboxButton>

      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <ListboxOptions
          class="absolute right-0 z-20 mt-1 max-h-60 w-[min(10rem,calc(100vw-2rem))] overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-gray-200 dark:ring-white/10 focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-for="locale in availableLocales"
            v-slot="{ active, selected }"
            :key="locale.code"
            :value="locale.code"
            as="template"
          >
            <li
              class="group flex flex-row relative cursor-default select-none px-3 py-2"
              :class="
                active
                  ? 'bg-primary-600 text-white dark:bg-primary-500'
                  : 'text-gray-900 dark:text-gray-100'
              "
            >
              <span
                class="block truncate"
                :class="selected ? 'font-medium' : 'font-normal'"
              >
                {{ locale.nativeName }}
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
                :class="
                  active
                    ? 'text-white'
                    : 'text-primary-600 dark:text-primary-500'
                "
              >
                <IconCheck class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </TransitionRoot>
    </div>
  </Listbox>
</template>
