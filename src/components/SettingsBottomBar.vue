<template>
  <div class="fixed bottom-0 left-0 right-0 z-40 pointer-events-none">
    <div class="absolute inset-0" />
    <div
      class="relative pointer-events-auto px-4 pb-6 pt-8 sm:px-6 lg:px-8 flex justify-end gap-3"
    >
      <slot />
    </div>
  </div>
</template>
