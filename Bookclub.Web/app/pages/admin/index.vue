<template>
  <div>
    <h1 class="text-h5 mb-4">Admin</h1>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="bc-card" rounded="lg">
          <v-card-title>Manage Books</v-card-title>
          <v-card-text class="bc-muted">
            Create, edit, and delete books.
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" to="/admin/books">Open</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin' })
</script>