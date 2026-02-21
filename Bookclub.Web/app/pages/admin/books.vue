<template>
  <div>
    <h1 class="text-h5 mb-4">Admin • Books</h1>

    <v-card class="bc-card" rounded="lg">
      <v-card-text>
        <div class="d-flex ga-2 flex-wrap mb-3">
          <v-btn color="primary" @click="openCreate">Add Book</v-btn>
          <v-btn variant="outlined" @click="load">Refresh</v-btn>
        </div>

        <v-progress-linear v-if="pending" indeterminate />

        <v-data-table
          v-else
          :items="books"
          :headers="headers"
          item-key="id"
        >
          <template #item.actions="{ item }">
            <v-btn size="small" variant="text" @click="openEdit(item)">Edit</v-btn>
            <v-btn size="small" variant="text" @click="doDelete(item)">Delete</v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <v-dialog v-model="dialog" max-width="520">
      <v-card>
        <v-card-title>{{ formMode === 'create' ? 'Add Book' : 'Edit Book' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.title" label="Title" />
          <v-text-field v-model="form.author" label="Author" />
          <v-textarea v-model="form.description" label="Description" rows="3" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert v-if="errMsg" type="error" variant="tonal" class="mt-4">
      {{ errMsg }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { booksService } from '~/services/booksService'
import type { BookDto } from '~/types/dtos'

definePageMeta({ middleware: 'admin' })

const headers = [
  { title: 'Id', key: 'id' },
  { title: 'Title', key: 'title' },
  { title: 'Author', key: 'author' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const books = ref<BookDto[]>([])
const pending = ref(false)
const errMsg = ref('')

const dialog = ref(false)
const saving = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const form = ref<{ id?: number; title: string; author: string; description: string }>({
  title: '',
  author: '',
  description: '',
})

async function load() {
  errMsg.value = ''
  pending.value = true
  try {
    books.value = await booksService.getAll()
  } catch (e: any) {
    errMsg.value = e?.message ?? 'Failed to load books'
  } finally {
    pending.value = false
  }
}

function openCreate() {
  formMode.value = 'create'
  form.value = { title: '', author: '', description: '' }
  dialog.value = true
}

function openEdit(b: BookDto) {
  formMode.value = 'edit'
  form.value = {
    id: Number(b.id),
    title: String(b.title ?? ''),
    author: String(b.author ?? ''),
    description: String(b.description ?? ''),
  }
  dialog.value = true
}

async function save() {
  errMsg.value = ''
  saving.value = true
  try {
    if (formMode.value === 'create') {
      await booksService.create(form.value)
    } else if (form.value.id != null) {
      await booksService.update(form.value.id, form.value)
    }
    dialog.value = false
    await load()
  } catch (e: any) {
    errMsg.value = e?.message ?? 'Save failed'
  } finally {
    saving.value = false
  }
}

async function doDelete(b: BookDto) {
  errMsg.value = ''
  try {
    await booksService.remove(Number(b.id))
    await load()
  } catch (e: any) {
    errMsg.value = e?.message ?? 'Delete failed'
  }
}

onMounted(load)
</script>