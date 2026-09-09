<template>
  <div>
    <div class="text-center">
      <h1
        class="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {{ t('auth.signInToAccount') }}
      </h1>
      <p class="mt-2 text-sm text-balance text-gray-600 dark:text-gray-400">
        {{ t('auth.signInDescription') }}
      </p>
    </div>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <CInput
        id="email"
        v-model="form.email"
        type="email"
        name="email"
        autocomplete="email"
        size="lg"
        :label="t('auth.emailAddress')"
        :placeholder="t('auth.enterEmailPlaceholder')"
        :icon-left="AtSymbolIcon"
        :errors="r$.$errors.email"
      />

      <CButton
        type="submit"
        size="lg"
        full-width
        :loading="isLoading"
        :loading-text="t('auth.sendingCode')"
      >
        {{ t('auth.sendCode') }}
        <template #icon-right>
          <IconArrowNarrowRight class="size-5" aria-hidden="true" />
        </template>
      </CButton>
    </form>

    <!-- An invitation, not a requirement: this screen already creates the
         account. Following it only means we get a name up front instead of
         asking for one after the code is verified. -->
    <p class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
      {{ t('auth.noAccountYet') }}
      <RouterLink
        :to="signUpTarget"
        class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
      >
        {{ t('auth.signUpInstead') }}
      </RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRegle } from '@regle/core'
import { email, required, withMessage } from '@regle/rules'
import { AtSymbolIcon } from '@heroicons/vue/24/outline'
import { IconArrowNarrowRight } from '@tabler/icons-vue'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import { authService } from '@/features/auth/service'
import { RouteNames } from '@/router/routeNames'
import { useTenantStore } from '@/features/tenant/tenant.store'

definePageMeta({
  name: RouteNames.auth.signIn,
})

const { t } = useI18n()
const tenantStore = useTenantStore()
const route = useRoute()
const router = useRouter()

// Coming back from the code screen to fix a typo should not mean retyping the
// whole address.
const form = reactive({
  email: typeof route.query.email === 'string' ? route.query.email : '',
})

const { r$ } = useRegle(form, {
  email: {
    required: withMessage(required, () => t('auth.emailRequired')),
    email: withMessage(email, () => t('auth.emailInvalid')),
  },
})

const isLoading = ref(false)

// Wherever the user was heading before being asked to sign in has to survive
// every hop of the flow, or they land on the home page after all this.
const signUpTarget = computed(() => ({
  name: RouteNames.auth.signUp,
  query: { redirect: route.query.redirect },
}))

const handleSubmit = async (): Promise<void> => {
  const { valid } = await r$.$validate()
  if (!valid || isLoading.value) return

  isLoading.value = true

  try {
    await authService.signInWithEmail(
      tenantStore.tenant?.name ?? '',
      form.email,
    )
    await router.push({
      name: RouteNames.auth.verify,
      query: { email: form.email, redirect: route.query.redirect },
    })
  } catch {
    toast.error(t('auth.sendCodeFailed'))
  } finally {
    isLoading.value = false
  }
}
</script>
