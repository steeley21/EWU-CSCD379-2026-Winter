<template>
  <v-card class="bc-card" rounded="lg">
    <v-card-title class="gp-card-title">
      Members <span class="gp-count">({{ members.length }})</span>
    </v-card-title>

    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />
      <div v-else-if="error" class="gp-error">{{ error }}</div>

      <div v-else-if="!members.length" class="gp-muted">
        No members found yet.
      </div>

      <div v-else class="gp-members">
        <div v-for="m in preview" :key="m.userId" class="gp-member">
          <div class="gp-avatar" aria-hidden="true">{{ initials(m.fullName) }}</div>
          <div class="gp-member-name">{{ m.fullName }}</div>
        </div>

        <div v-if="members.length > preview.length" class="gp-muted gp-small">
          +{{ members.length - preview.length }} more
        </div>
      </div>
    </v-card-text>

    <v-card-actions v-if="canManage" class="gp-actions">
      <v-btn
        variant="tonal"
        size="small"
        prepend-icon="mdi-email-plus-outline"
        @click="$emit('invite')"
      >
        Invite Member
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import type { GroupMemberDto } from '~/types/dtos'

const props = defineProps<{
  members: GroupMemberDto[]
  loading: boolean
  error: string
  canManage?: boolean
}>()

defineEmits<{ invite: [] }>()

const preview = computed(() => props.members.slice(0, 6))

function initials(name: string) {
  const parts = String(name).trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('') || '•'
}
</script>

<style scoped>
.gp-card-title { font-family: var(--font-display); font-weight: 700; }
.gp-count { color: var(--text-muted); font-weight: 500; margin-left: 0.25rem; }
.gp-members { display: flex; flex-direction: column; gap: 0.6rem; }
.gp-member { display: flex; align-items: center; gap: 0.65rem; }
.gp-avatar {
  width: 34px; height: 34px;
  border-radius: 12px;
  background: var(--pale-oak);
  color: var(--coffee-bean);
  display: grid; place-items: center;
  font-weight: 800; font-size: 0.78rem;
}
.gp-member-name { font-weight: 600; color: var(--coffee-bean); }
.gp-muted { color: var(--text-muted); }
.gp-small { font-size: 0.85rem; }
.gp-error {
  color: #b94a48;
  background: #fff5f5;
  border: 1px solid rgba(185, 74, 72, 0.25);
  border-radius: 14px;
  padding: 0.75rem 0.9rem;
}
.gp-actions { padding: 0 1rem 0.75rem; }
</style>