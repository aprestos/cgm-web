<template>
  <main
    class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-6 py-12"
  >
    <div class="max-w-md text-center">
      <!--
        No tenant resolved from this host, so nothing here is themed by a
        convention — this is a platform surface, and it is Congrem answering.
        Hence the mark in Congrem green rather than the monochrome cut the
        tenant-facing pages use, and -300 in dark mode because the base green
        does not hold its contrast against ink.
      -->
      <CongremLogo
        class="mx-auto mb-10 h-9 w-auto text-congrem dark:text-congrem-300"
      />
      <component
        :is="isPending ? IconClock : IconWorldOff"
        class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      />
      <h1 class="mt-6 text-xl font-semibold text-gray-900 dark:text-white">
        {{ isPending ? 'Almost there' : 'This domain is not connected' }}
      </h1>
      <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
        {{
          isPending
            ? 'This address is registered but still being verified. DNS changes can take up to an hour to reach everyone, so it is worth trying again shortly.'
            : 'No convention is using this address yet. If it belongs to you, add it under Domains in your convention settings.'
        }}
      </p>
      <p
        class="mt-6 font-mono text-sm text-gray-500 dark:text-gray-500 break-all"
      >
        {{ hostname }}
      </p>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IconClock, IconWorldOff } from '@tabler/icons-vue'
import type { DomainStatus } from '@/features/domains/domain.model'
import CongremLogo from '@/components/CongremLogo.vue'

interface Props {
  hostname: string
  /** Null when the hostname is not recorded at all. */
  status: DomainStatus | null
}

const props = defineProps<Props>()

// 'failed' is deliberately not treated as pending: telling a visitor to wait
// for something that has already given up would leave them refreshing forever.
const isPending = computed(
  () => props.status === 'pending' || props.status === 'verifying',
)
</script>
