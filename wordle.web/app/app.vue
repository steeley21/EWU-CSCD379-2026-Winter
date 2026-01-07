<template>
    <v-container>
        <v-btn variant="flat" color="primary" @click="increment">Hello {{ count }}</v-btn>
    </v-container>
</template>

<script setup lang="ts">
console.log("hi!!");

let count = ref(0);
console.log(count.value)

function increment() {
    count.value++;
    console.log(count.value);
}
</script>