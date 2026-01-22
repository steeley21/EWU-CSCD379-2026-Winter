<template>
    <v-container>
        <v-btn variant="flat" color="primary" @click="increment">Hello {{ count }}</v-btn>
        <WordleGame />
    </v-container>
</template>

<script setup lang="ts">
import WordleGame from '../components/WordleGame.vue'
console.log("hi!!");

let count = ref(0);
console.log(count.value)

function increment() {
        count.value++;
        console.log(count.value);
}
</script>