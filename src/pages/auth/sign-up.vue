<template>
  <div>
    <div class="text-center">
      <h1
        class="font-display text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
      >
        {{ t('auth.createAccount') }}
      </h1>
      <p class="mt-2 text-sm text-balance text-gray-600 dark:text-gray-400">
        {{ t('auth.signUpDescription') }}
      </p>
    </div>

    <form class="mt-8 space-y-5" novalidate @submit.prevent="handleSubmit">
      <CInput
        id="name"
        v-model="form.name"
        type="text"
        name="name"
        autocomplete="name"
        size="lg"
        :label="t('auth.name')"
        :placeholder="t('auth.enterNamePlaceholder')"
        :icon-left="UserIcon"
        :errors="r$.$errors.name"
        :helper-text="t('auth.nameHelper')"
      />

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

    <p class="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
      {{ t('auth.alreadyHaveAccount') }}
      <RouterLink
        :to="signInTarget"
        class="font-semibold text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
      >
        {{ t('auth.signIn') }}
      </RouterLink>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useRegle } from '@regle/core'
import { email, minLength, required, withMessage } from '@regle/rules'
import { AtSymbolIcon, UserIcon } from '@heroicons/vue/24/outline'
import { IconArrowNarrowRight } from '@tabler/icons-vue'
import { toast } from 'vue-sonner'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import { authService } from '@/features/auth/service'
import { RouteNames } from '@/router/routeNames'
import { useTenantStore } from '@/features/tenant/tenant.store'

definePageMeta({
  name: RouteNames.auth.signUp,
})

const { t } = useI18n()
const tenantStore = useTenantStore()
const route = useRoute()
const router = useRouter()

const MIN_NAME_LENGTH = 2

const form = reactive({
  name: '',
  email: typeof route.query.email === 'string' ? route.query.email : '',
})

const { r$ } = useRegle(form, {
  name: {
    required: withMessage(required, () => t('auth.displayNameRequired')),
    minLength: withMessage(minLength(MIN_NAME_LENGTH), () =>
      t('auth.displayNameMinLength'),
    ),
  },
  email: {
    required: withMessage(required, () => t('auth.emailRequired')),
    email: withMessage(email, () => t('auth.emailInvalid')),
  },
})

const isLoading = ref(false)

const signInTarget = computed(() => ({
  name: RouteNames.auth.signIn,
  query: { redirect: route.query.redirect },
}))

const handleSubmit = async (): Promise<void> => {
  const { valid } = await r$.$validate()
  if (!valid || isLoading.value) return

  isLoading.value = true

  try {
    await authService.signUpWithEmail(
      tenantStore.tenant?.name ?? '',
      form.name.trim(),
      form.email,
    )
    // `flow` is what sends "use a different address" back here rather than to
    // sign-in, so a mistyped address does not cost the name as well.
    await router.push({
      name: RouteNames.auth.verify,
      query: {
        email: form.email,
        flow: 'sign-up',
        redirect: route.query.redirect,
      },
    })
  } catch {
    toast.error(t('auth.sendCodeFailed'))
  } finally {
    isLoading.value = false
  }
}
</script>
