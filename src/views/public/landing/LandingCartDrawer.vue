<template>
  <div>
    <TransitionRoot as="template" :show="open">
      <Dialog class="relative z-100" @close="closeModal">
        <TransitionChild
          as="template"
          enter="ease-in-out duration-500"
          enter-from="opacity-0"
          enter-to=""
          leave="ease-in-out duration-500"
          leave-from=""
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-500/75 transition-opacity"></div>
        </TransitionChild>

        <div class="fixed inset-0 overflow-hidden">
          <div class="absolute inset-0 overflow-hidden">
            <div
              class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16"
            >
              <TransitionChild
                as="template"
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enter-from="translate-x-full"
                enter-to="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leave-from="translate-x-0"
                leave-to="translate-x-full"
              >
                <DialogPanel class="pointer-events-auto w-screen max-w-md">
                  <div
                    class="flex h-full flex-col overflow-y-auto bg-white shadow-xl"
                  >
                    <div class="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div class="flex items-start justify-between">
                        <DialogTitle class="text-lg font-medium text-gray-900"
                          >Shopping cart</DialogTitle
                        >
                        <div class="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            class="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            @click="open = false"
                          >
                            <span class="absolute -inset-0.5"></span>
                            <span class="sr-only">Close panel</span>
                            <XMarkIcon class="size-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div class="mt-8">
                        <div class="flow-root">
                          <ul
                            role="list"
                            class="-my-6 divide-y divide-gray-200"
                          >
                            <li
                              v-for="item in cartItems"
                              :key="item.ticket.id"
                              class="flex py-6"
                            >
                              <div
                                class="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-gray-50"
                              >
                                <span
                                  class="px-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                                >
                                  <IconTicketFilled size="50" />
                                </span>
                              </div>

                              <div class="ml-4 flex flex-1 flex-col">
                                <div>
                                  <div
                                    class="flex justify-between text-base font-medium text-gray-900"
                                  >
                                    <h3>{{ item.ticket.name }}</h3>
                                    <p class="ml-4">
                                      {{ formatPrice(item.ticket.price) }}
                                    </p>
                                  </div>
                                  <p class="mt-1 text-sm text-gray-500">
                                    {{
                                      formatDateRange(
                                        item.ticket.validFrom,
                                        item.ticket.validUntil,
                                        locale,
                                      )
                                    }}
                                  </p>
                                </div>
                                <div
                                  class="flex flex-1 items-end justify-between text-sm"
                                >
                                  <p class="text-gray-500">
                                    Qty {{ item.quantity }}
                                  </p>

                                  <div class="flex">
                                    <button
                                      type="button"
                                      class="font-medium text-indigo-600 hover:text-indigo-500"
                                      @click="removeFromCart(item.ticket.id)"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div class="border-t border-gray-200 px-4 py-6 sm:px-6">
                      <div
                        class="flex justify-between text-base font-medium text-gray-900"
                      >
                        <p>Subtotal</p>
                        <p>{{ formatPrice(totalPrice) }}</p>
                      </div>
                      <p class="mt-0.5 text-sm text-gray-500">
                        Shipping and taxes calculated at checkout.
                      </p>
                      <div class="mt-6">
                        <a
                          href="#"
                          class="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-xs hover:bg-indigo-700"
                          >Checkout</a
                        >
                      </div>
                      <div
                        class="mt-6 flex justify-center text-center text-sm text-gray-500"
                      >
                        <p>
                          or{{ ' ' }}
                          <button
                            type="button"
                            class="font-medium text-indigo-600 hover:text-indigo-500"
                            @click="open = false"
                          >
                            Continue Shopping
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </TransitionRoot>
  </div>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useCart } from '@/stores/cart.store.ts'
import { formatPrice } from '@/utils/price.ts'
import { IconTicketFilled } from '@tabler/icons-vue'
import { formatDateRange } from '@/utils/date.ts'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const open = defineModel<boolean>('open', { default: false })

const { cartItems, totalPrice, removeFromCart } = useCart()

const closeModal = (): void => {
  open.value = false
}
</script>
