<template>
  <v-card class="bc-card" rounded="lg">
    <div class="gp-head">
      <div>
        <div class="gp-title">
          Books <span class="gp-count">({{ groupBooks.length }})</span>
        </div>
        <div class="gp-sub">Books currently in this group</div>
      </div>

      <div class="gp-actions">
        <button
          class="gp-btn-ghost"
          type="button"
          @click="$emit('library')"
        >
          Library
        </button>

        <button v-if="canManage" class="gp-btn" type="button" @click="$emit('add')">
          + Add book
        </button>
      </div>
    </div>

    <v-card-text class="pt-0">
      <v-progress-linear v-if="loading" indeterminate color="var(--camel)" />
      <div v-else-if="error" class="gp-error">{{ error }}</div>

      <div v-else-if="!groupBooks.length" class="gp-muted">
        No books added to this group yet.
      </div>

      <div v-else class="gp-books">
        <div v-for="gb in preview" :key="gb.gbId" class="gp-book-row">
          <div class="gp-book-left">
            <div class="gp-cover">
              <v-img
                v-if="coverUrl(gb.book)"
                :src="coverUrl(gb.book)!"
                width="44"
                height="66"
                cover
                class="rounded"
                :alt="String(gb.book.title ?? 'Book cover')"
              >
                <template #error>
                  <div class="gp-cover-placeholder">
                    <v-icon icon="mdi-book-open-page-variant" size="18" />
                  </div>
                </template>
              </v-img>

              <div v-else class="gp-cover-placeholder">
                <v-icon icon="mdi-book-open-page-variant" size="18" />
              </div>
            </div>

            <div class="gp-meta">
              <div class="gp-book-title">{{ String(gb.book.title ?? 'Untitled') }}</div>
              <div class="gp-muted gp-small">{{ authorLabel(gb.book) }}</div>
            </div>
          </div>

          <div class="gp-row-actions" v-if="canManage">
            <button class="gp-btn-ghost" type="button" @click="$emit('remove', gb.gbId)">
              Remove
            </button>
          </div>
        </div>

        <div v-if="groupBooks.length > preview.length" class="gp-muted gp-small">
          +{{ groupBooks.length - preview.length }} more
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { GroupBookDto } from '~/types/dtos'
import { authorLabel, coverUrl } from '~/utils/books'

defineEmits<{
  (e: 'add'): void
  (e: 'remove', gbId: number): void
  (e: 'library'): void
}>()

const props = defineProps<{
  groupBooks: GroupBookDto[]
  canManage: boolean
  loading: boolean
  error: string
}>()

const preview = computed(() => props.groupBooks.slice(0, 4))
</script>

<style scoped>
.gp-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:1rem;
  padding: 1rem 1rem 0.25rem;
}

.gp-actions{
  display:flex;
  align-items:center;
  gap:0.6rem;
  flex-wrap: wrap; /* helps on tight widths */
  justify-content:flex-end;
}

.gp-title{
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 1.1rem;
  color: var(--coffee-bean);
}

.gp-count { color: var(--text-muted); font-weight: 500; margin-left: 0.25rem; }

.gp-sub{
  color: var(--text-muted);
  font-size: 0.9rem;
}

.gp-btn{
  display:inline-flex;
  align-items:center;
  gap:0.4rem;
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--bg);
  background: var(--coffee-bean);
  border:none;
  border-radius: var(--radius-pill);
  padding: 0.5rem 1rem;
  cursor:pointer;
  transition: background var(--ease), transform var(--ease), box-shadow var(--ease);
  box-shadow: 0 3px 12px rgba(109, 76, 61, 0.2);
}
.gp-btn:hover{
  background: var(--camel);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(163, 145, 113, 0.35);
}

.gp-btn-ghost{
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--coffee-bean);
  background: transparent;
  border: 1px solid var(--pale-oak);
  border-radius: var(--radius-pill);
  padding: 0.5rem 1rem;
  cursor:pointer;
  transition: border-color var(--ease), background var(--ease);
}
.gp-btn-ghost:hover{
  border-color: var(--camel);
  background: rgba(220, 201, 182, 0.2);
}

.gp-books { display:flex; flex-direction:column; gap:0.9rem; }
.gp-book-row{
  padding: 0.75rem 0.9rem;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg);
  position: relative;
}
.gp-book-title{
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--coffee-bean);
}
.gp-row-actions{
  margin-top: 0.65rem;
  display:flex;
  justify-content:flex-end;
}
.gp-muted{ color: var(--text-muted); }
.gp-small{ font-size: 0.85rem; }

.gp-error{
  color:#b94a48;
  background:#fff5f5;
  border:1px solid rgba(185,74,72,0.25);
  border-radius:14px;
  padding:0.75rem 0.9rem;
}

.gp-book-left{
  display:flex;
  gap:0.9rem;
  align-items:flex-start;
}

.gp-cover{
  width:44px;
  height:66px;
  flex:0 0 auto;
}

.gp-cover-placeholder{
  width:44px;
  height:66px;
  border-radius: 10px;
  border: 1px solid var(--border);
  display:flex;
  align-items:center;
  justify-content:center;
  color: var(--text-muted);
  background: rgba(220, 201, 182, 0.12);
}

.gp-meta{ flex: 1 1 auto; min-width: 0; }
</style>