<template>
  <SignInForm ref="formRef" @submit="handleSubmit" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import SignInForm from '@/views/auth/SignInForm.vue'
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
const route = useRoute()

const handleSubmit = async (email: string): Promise<void> => {
  try {
    await authService.signInWithEmail(email)
    await router.push({
      name: RouteNames.auth.verify,
      query: { email, redirect: route.query.redirect },
    })
  } catch {
    toast.error('Failed to sign in. Please try again later.')
  } finally {
    formRef.value?.setLoading(false)
  }
}
</script>
