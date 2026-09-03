<template>
  <div
    v-if="errors && errors.length > 0"
    :id="id"
    class="mt-2 text-sm text-red-600 dark:text-red-400"
  >
    <p v-for="(error, index) in errors" :key="index">
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  errors?: string[] | undefined
  /** Referenced by the field's aria-describedby. */
  id?: string
}

withDefaults(defineProps<Props>(), {
  errors: undefined,
  id: undefined,
})
</script>
