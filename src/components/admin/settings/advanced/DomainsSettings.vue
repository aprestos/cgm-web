<template>
  <SettingsSection
    title="Domains"
    description="Use your own web address for your convention site"
  >
    <div class="space-y-6">
      <form class="space-y-2" @submit.prevent="handleAdd">
        <!-- The hint sits outside the row on purpose. Passed to CInput as
             helper-text it renders inside the field's wrapper, growing the
             flex item, and the button stretches to match it. -->
        <div class="flex flex-col sm:flex-row gap-3">
          <CInput
            id="new-domain"
            v-model="newHostname"
            class="flex-1"
            placeholder="tickets.yourconvention.com"
            :errors="addErrors"
            :disabled="isAdding"
          />
          <CButton type="submit" :loading="isAdding" loading-text="Adding...">
            <IconPlus class="h-5 w-5 mr-2 -ml-1" />
            Add domain
          </CButton>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Enter the address on its own, without https:// or a trailing path.
        </p>
      </form>

      <p v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">
        Loading domains...
      </p>

      <p
        v-else-if="domains.length === 0"
        class="text-sm text-gray-500 dark:text-gray-400"
      >
        No domains yet.
      </p>

      <ul v-else class="space-y-4">
        <li
          v-for="domain in domains"
          :key="domain.id"
          class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p
                  class="text-sm font-medium text-gray-900 dark:text-white truncate"
                >
                  {{ domain.hostname }}
                </p>
                <CBadge
                  v-if="domain.isPrimary"
                  type="indigo"
                  size="sm"
                  text="Primary"
                />
                <CBadge
                  :type="statusBadge(domain).type"
                  size="sm"
                  :text="statusBadge(domain).label"
                />
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ describe(domain) }}
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <CButton
                v-if="canRefresh(domain)"
                type="button"
                variant="secondary"
                :loading="refreshingId === domain.id"
                loading-text="Checking..."
                @click="handleRefresh(domain)"
              >
                <IconRefresh class="h-5 w-5 mr-2 -ml-1" />
                Check status
              </CButton>
              <CButton
                type="button"
                variant="secondary"
                :disabled="domain.isPrimary"
                @click="askToRemove(domain)"
              >
                <IconTrash class="h-5 w-5" />
                <span class="sr-only">Remove {{ domain.hostname }}</span>
              </CButton>
            </div>
          </div>

          <div
            v-if="domain.lastError"
            class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3"
          >
            <p class="text-sm text-red-700 dark:text-red-300">
              {{ domain.lastError }}
            </p>
          </div>

          <!-- Shown verbatim as the provider described them: an apex needs an A
               record and a subdomain a CNAME, so the values are not reshaped. -->
          <div v-if="dnsRecords(domain).length > 0" class="space-y-3">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Add the {{ recordNoun(domain) }} below at your DNS provider. Do
              not enable a proxy on it &mdash; an "orange cloud" in Cloudflare
              &mdash; or verification never completes.
            </p>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="text-left text-gray-500 dark:text-gray-400">
                    <th class="py-2 pr-4 font-medium">Type</th>
                    <th class="py-2 pr-4 font-medium">Name</th>
                    <th class="py-2 pr-4 font-medium">Value</th>
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-gray-200 dark:divide-gray-700 font-mono text-gray-900 dark:text-white"
                >
                  <tr
                    v-for="(record, index) in dnsRecords(domain)"
                    :key="index"
                  >
                    <td class="py-2 pr-4 whitespace-nowrap">
                      {{ record.recordType ?? 'CNAME' }}
                    </td>
                    <td class="py-2 pr-4 break-all">
                      {{ record.hostlabel || '@' }}
                    </td>
                    <td class="py-2 pr-4 break-all">
                      <button
                        type="button"
                        class="text-left hover:underline"
                        :title="`Copy ${record.requiredValue}`"
                        @click="copy(record.requiredValue)"
                      >
                        {{ record.requiredValue }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <ConfirmationDialog
      :open="domainToRemove !== null"
      title="Remove domain"
      :message="removeMessage"
      confirm-text="Remove"
      :loading="isRemoving"
      @confirm="handleRemove"
      @close="domainToRemove = null"
    />
  </SettingsSection>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { IconPlus, IconRefresh, IconTrash } from '@tabler/icons-vue'
import CBadge from '@/components/CBadge.vue'
import CButton from '@/components/CButton.vue'
import CInput from '@/components/CInput.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import SettingsSection from '@/components/SettingsSection.vue'
import { useTenantStore } from '@/features/tenant/tenant.store'
import domainsService from '@/features/domains/service'
import type {
  DnsRecord,
  DomainStatus,
  TenantDomain,
} from '@/features/domains/domain.model'

const tenantStore = useTenantStore()

type BadgeType = 'gray' | 'green' | 'yellow' | 'red'

const STATUS_BADGE: Record<DomainStatus, { type: BadgeType; label: string }> = {
  active: { type: 'green', label: 'Active' },
  verifying: { type: 'yellow', label: 'Verifying' },
  pending: { type: 'gray', label: 'Pending' },
  failed: { type: 'red', label: 'Failed' },
}

const domains = ref<TenantDomain[]>([])
const newHostname = ref('')
const addErrors = ref<string[]>([])
const isLoading = ref(true)
const isAdding = ref(false)
const isRemoving = ref(false)
const refreshingId = ref<number | null>(null)
const domainToRemove = ref<TenantDomain | null>(null)

const removeMessage = computed(() =>
  domainToRemove.value
    ? `${domainToRemove.value.hostname} will stop serving your site. Visitors using it will no longer reach you.`
    : '',
)

const statusBadge = (
  domain: TenantDomain,
): { type: BadgeType; label: string } => STATUS_BADGE[domain.status]

const recordNoun = (domain: TenantDomain): string =>
  dnsRecords(domain).length === 1 ? 'record' : 'records'

const dnsRecords = (domain: TenantDomain): DnsRecord[] =>
  domain.status === 'active' ? [] : (domain.dnsRecords ?? [])

// Only an individual custom domain has provider state worth polling; a
// wildcard or platform hostname is live from the start. A missing provider id
// is not a reason to hide this -- refreshing is what looks the id up and
// stores it, so the rows that lack one are the ones that most need it.
const canRefresh = (domain: TenantDomain): boolean =>
  domain.provider === 'railway'

const describe = (domain: TenantDomain): string => {
  if (domain.provider !== 'railway') {
    return 'Included with your convention, nothing to set up.'
  }
  switch (domain.status) {
    case 'active':
      return 'Serving your site.'
    case 'verifying':
      return 'Waiting for the DNS record below. This can take up to an hour.'
    case 'pending':
      return 'Being set up.'
    case 'failed':
      return 'Setup did not complete.'
  }
}

const load = async (): Promise<void> => {
  const tenantId = tenantStore.tenant?.id
  if (!tenantId) return
  try {
    domains.value = await domainsService.getByTenant(tenantId)
  } catch (error) {
    toast.error((error as Error).message)
  } finally {
    isLoading.value = false
  }
}

const handleAdd = async (): Promise<void> => {
  const tenantId = tenantStore.tenant?.id
  const hostname = newHostname.value.trim()
  addErrors.value = []

  if (!tenantId || !hostname) {
    addErrors.value = ['Enter a domain']
    return
  }

  isAdding.value = true
  try {
    await domainsService.add(tenantId, hostname)
    newHostname.value = ''
    await load()
    toast.success(`${hostname} was added`)
  } catch (error) {
    addErrors.value = [(error as Error).message]
  } finally {
    isAdding.value = false
  }
}

const handleRefresh = async (domain: TenantDomain): Promise<void> => {
  refreshingId.value = domain.id
  try {
    const updated = await domainsService.refresh(domain.id)
    domains.value = domains.value.map((current) =>
      current.id === updated.id ? updated : current,
    )
    if (updated.status === 'active') {
      toast.success(`${updated.hostname} is live`)
    }
  } catch (error) {
    toast.error((error as Error).message)
  } finally {
    refreshingId.value = null
  }
}

const askToRemove = (domain: TenantDomain): void => {
  domainToRemove.value = domain
}

const handleRemove = async (): Promise<void> => {
  const domain = domainToRemove.value
  if (!domain) return

  isRemoving.value = true
  try {
    await domainsService.remove(domain.id)
    domains.value = domains.value.filter((current) => current.id !== domain.id)
    toast.success(`${domain.hostname} was removed`)
    domainToRemove.value = null
  } catch (error) {
    toast.error((error as Error).message)
  } finally {
    isRemoving.value = false
  }
}

const copy = async (value: string): Promise<void> => {
  await navigator.clipboard.writeText(value)
  toast.success('Copied')
}

onMounted(load)
</script>
