<template>
  <!--
    One grid row that is at least the viewport tall, so the form column can
    centre its content against the real height. `dvh` rather than `vh`: mobile
    Safari's `vh` counts the space behind its toolbar, which pushed the column
    taller than the screen and produced a scrollbar on a screen with nothing to
    scroll to.
  -->
  <div
    class="grid min-h-dvh bg-gray-50 lg:grid-cols-2 dark:bg-gray-950 dark:text-white"
  >
    <div class="relative flex flex-col px-6 py-8 sm:px-10">
      <!--
        Two washes of the tenant's own hue, so the column carries some of the
        poster's warmth instead of reading as a blank sheet. Both are drawn from
        the primary ramp rather than a picked colour: a tenant retheme moves
        them with everything else, and a second fixed hue would clash with half
        the conventions on the platform. Clipping lives on this layer rather
        than the column so it cannot swallow the language menu.
      -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div
          class="absolute -top-40 -left-32 size-[30rem] rounded-full bg-primary-300/40 blur-3xl dark:bg-primary-500/20"
        />
        <div
          class="absolute -right-32 -bottom-48 size-[34rem] rounded-full bg-primary-500/15 blur-3xl dark:bg-primary-400/10"
        />
      </div>

      <!-- The mark is the only tenant branding a phone gets, so it leads the
           screen rather than sitting in a corner. -->
      <header class="relative flex justify-center">
        <img
          v-if="logo"
          :src="logo"
          :alt="tenantStore.tenant?.name ?? ''"
          class="h-14 w-auto sm:h-16"
        />
        <SkeletonLoader v-else class="h-14 w-44 sm:h-16" />
      </header>

      <main class="relative flex flex-1 items-center justify-center py-10">
        <div class="w-full max-w-sm">
          <NuxtPage />
        </div>
      </main>

      <!-- Opens upward: the switcher sits on the bottom edge of a page that is
           exactly one viewport tall and never scrolls, so a menu dropping below
           it would have nowhere to go. -->
      <footer class="relative flex justify-center">
        <LanguageSwitcher placement="top" />
      </footer>
    </div>

    <!--
      Decorative, and every fact on it is repeated elsewhere in the app, so it
      is dropped below lg rather than stacked: on a phone it would only push the
      form off the screen.
    -->
    <aside
      class="relative hidden overflow-hidden bg-primary-700 lg:block dark:bg-primary-950"
    >
      <img
        v-if="poster"
        :src="poster"
        alt=""
        aria-hidden="true"
        class="absolute inset-0 size-full object-cover"
      />
      <div
        v-else
        class="absolute inset-0 bg-linear-to-br from-primary-500 to-primary-800"
      />

      <!-- Carries the caption's contrast independently of whatever the poster
           happens to be behind it. -->
      <div
        class="absolute inset-0 bg-linear-to-t from-gray-950/85 via-gray-950/35 to-gray-950/10"
      />

      <div class="absolute inset-x-0 bottom-0 p-10 xl:p-12">
        <!-- A poster is already the tenant's own artwork, so repeating the mark
             over it only competes with it. The mark earns its place on the
             gradient, where nothing else identifies the convention. -->
        <img
          v-if="!poster && panelLogo"
          :src="panelLogo"
          alt=""
          aria-hidden="true"
          class="mb-6 h-10 w-auto"
        />
        <p
          v-if="title"
          class="font-display text-3xl font-bold text-balance text-white xl:text-4xl"
        >
          {{ title }}
        </p>
        <p v-if="caption" class="mt-3 text-sm text-white/80">
          {{ caption }}
        </p>
      </div>
    </aside>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
import SkeletonLoader from '@/components/SkeletonLoader.vue'
import { useEditionStore } from '@/features/events/edition.store'
import { LogoType } from '@/features/tenant/tenant.model'
import { useTenantStore } from '@/features/tenant/tenant.store'
import { formatDateRange } from '@/utils/date'

const tenantStore = useTenantStore()
const editionStore = useEditionStore()
const { locale } = useI18n()

const logo = computed(() => tenantStore.getLogo(LogoType.long))

// The panel logo always sits on the dark end of the scrim, so it wants the
// light mark whatever the page theme is. getLogo falls back to the plain long
// mark for tenants that only uploaded one.
const panelLogo = computed(() => tenantStore.getLogo(LogoType.long_light))

const poster = computed(() => editionStore.edition?.poster_url)

const title = computed(
  () => editionStore.edition?.name || tenantStore.tenant?.name || '',
)

// Dates and place read as one line; either half may be missing, and
// formatDateRange answers '-' rather than '' when it has no range to show.
const caption = computed(() => {
  const range = formatDateRange(
    editionStore.edition?.start_date,
    editionStore.edition?.end_date,
    locale.value,
  )
  const parts = [
    range === '-' ? '' : range,
    editionStore.edition?.location?.title,
  ]
  return parts.filter(Boolean).join(' · ')
})
</script>
