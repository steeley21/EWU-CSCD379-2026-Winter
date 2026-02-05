<!-- app.vue -->
<template>
  <v-app>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </v-app>
</template>

<style>
html, body, #__nuxt {
  height: 100%;
}

/* Terminal-ish base */
body {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  letter-spacing: 0.01em;
}

/* Alien “glow” background */
.v-application {
  background:
    radial-gradient(900px circle at 18% 12%, rgba(57, 255, 20, 0.08), transparent 60%),
    radial-gradient(850px circle at 82% 18%, rgba(255, 43, 214, 0.06), transparent 55%),
    radial-gradient(1200px circle at 50% 110%, rgba(0, 229, 255, 0.05), transparent 55%),
    linear-gradient(180deg, #050607 0%, #07090C 45%, #050607 100%) !important;
}
</style>
