<template>
  <Transition
    name="slide-fade"
    mode="out-in"
    enter-active-class="transition-all duration-500 ease-out"
    leave-active-class="transition-all duration-300 ease-in"
    enter-from-class="opacity-0 translate-y-8"
    leave-to-class="opacity-0 -translate-y-8"
  >
    <SignInForm
      v-if="!emailSent"
      key="form"
      ref="formRef"
      @submit="handleSubmit"
    />
    <SignInVerify
      v-else
      key="success"
      :email="email"
      @back="handleBack"
      @verify="handleVerify"
    />
  </Transition>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SignInForm from '@/views/auth/SignInForm.vue'
import SignInVerify from '@/views/auth/SignInVerify.vue'
import { authService } from '@/features/auth/service'
import { toast } from 'vue-sonner'
import router from '@/router'
import { RouteNames } from '@/router/routeNames.ts'
import { useRoute } from 'vue-router'

interface SignInFormMethods {
  setLoading: (loading: boolean) => void
  reset: () => void
}

const formRef = ref<SignInFormMethods | null>(null)
const email = ref<string>('')
const emailSent = ref<boolean>(false)
const isVerifying = ref<boolean>(false)
const route = useRoute()

const handleSubmit = async (emailValue: string): Promise<void> => {
  email.value = emailValue

  try {
    await authService.signInWithEmail(emailValue)
    emailSent.value = true
  } catch {
    toast.error('Failed to sign in. Please try again later.')
  } finally {
    formRef.value?.setLoading(false)
  }
}

const handleBack = (): void => {
  emailSent.value = false
  formRef.value?.reset()
}

const handleVerify = async (otp: string): Promise<void> => {
  if (!otp) return
  isVerifying.value = true
  try {
    await authService.validateOTP(email.value, otp)
    await router.push({
      name: RouteNames.auth.confirm,
      query: { redirect: route.query.redirect },
    })
  } catch (error) {
    console.error('OTP verification error:', error)
    toast.error('Unable to verify OTP. Please try again.')
  } finally {
    isVerifying.value = false
  }
}
</script>
