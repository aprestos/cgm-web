<script setup lang="ts">
/**
 * The shape a tournament is presented in: its header, then the facts, prizes
 * and description, with the roster alongside once there is room for both.
 *
 * Every part is a slot over its default rendering, so a caller changes only
 * what it needs — the admin editor swaps each section for its fields, the
 * create preview leaves the aside out — and the order and spacing stay in
 * one place instead of being restated at each call site.
 */
import TournamentHeaderBlock from './TournamentHeaderBlock.vue'
import TournamentDetailsFacts from './TournamentDetailsFacts.vue'
import TournamentDetailsPrizes from './TournamentDetailsPrizes.vue'
import TournamentDetailsAbout from './TournamentDetailsAbout.vue'
import type { CreateTournament } from '../tournament.model.ts'

interface Props {
  tournament: CreateTournament
  /** Passed through to the header — a cover that is not on the record yet. */
  cover?: string
  placeholderTitle?: string
  /** Tighter spacing, for a narrow column such as the create preview. */
  dense?: boolean
}

withDefaults(defineProps<Props>(), {
  cover: undefined,
  placeholderTitle: undefined,
  dense: false,
})
</script>

<template>
  <div>
    <!-- The whole header is replaceable, not just its actions: editing it in
         place means putting fields where it was. -->
    <slot name="header">
      <TournamentHeaderBlock
        :tournament="tournament"
        :cover="cover"
        :placeholder-title="placeholderTitle"
        :dense="dense"
      >
        <template v-if="$slots['header-actions']" #actions="actionProps">
          <slot name="header-actions" v-bind="actionProps" />
        </template>
      </TournamentHeaderBlock>
    </slot>

    <!-- Details on the left, the roster on the right once there is room for
         both; stacked below lg, where the roster follows the description. -->
    <div :class="$slots.aside ? 'grid lg:grid-cols-[minmax(0,1fr)_340px]' : ''">
      <div
        class="flex flex-col gap-6"
        :class="dense ? 'p-4' : 'px-4 py-5 sm:p-6'"
      >
        <slot name="facts">
          <TournamentDetailsFacts :tournament="tournament" />
        </slot>
        <slot name="prizes">
          <TournamentDetailsPrizes :tournament="tournament" />
        </slot>
        <slot name="about">
          <TournamentDetailsAbout :tournament="tournament" />
        </slot>
      </div>

      <slot name="aside" />
    </div>
  </div>
</template>
