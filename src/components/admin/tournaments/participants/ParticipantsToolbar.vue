<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  IconSearch,
  IconSquareRoundedChevronDown,
  IconSquareRoundedChevronUp,
} from '@tabler/icons-vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'

interface Props {
  /** A full tournament has no spot left to add anyone into */
  full: boolean
}

defineProps<Props>()

const query = defineModel<string>('query', { required: true })
const addOpen = defineModel<boolean>('addOpen', { required: true })

const { t } = useI18n()
</script>

<template>
  <div class="px-4 py-4 sm:px-6">
    <div class="flex flex-row">
      <div class="flex-1 pr-4">
        <CInput
          id="participant-search"
          v-model="query"
          type="search"
          autocomplete="off"
          :aria-label="t('admin.tournaments.participantsDialog.searchLabel')"
          :placeholder="
            t('admin.tournaments.participantsDialog.searchPlaceholder')
          "
        >
          <template #icon-left>
            <IconSearch class="size-5" aria-hidden="true" />
          </template>
        </CInput>
      </div>
      <CButton
        variant="secondary"
        :disabled="full"
        :pressed="addOpen"
        @click="addOpen = !addOpen"
      >
        {{ t('admin.tournaments.participantsDialog.add.open') }}
        <template #icon-left>
          <IconSquareRoundedChevronUp v-if="addOpen" class="size-4" />
          <IconSquareRoundedChevronDown v-else class="size-4" />
        </template>
      </CButton>
    </div>
  </div>
</template>
