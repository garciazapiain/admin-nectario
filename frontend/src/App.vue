<script setup>
import DefaultLayout from "./layouts/DefaultLayout.vue";

const redirectUrl = "https://lista-peligro.vercel.app/";
</script>

<template>
  <div class="app-shell">
    <DefaultLayout />

    <div
      class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 px-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-blocker-title"
      aria-describedby="app-blocker-description"
    >
      <div class="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
        <h1 id="app-blocker-title" class="text-2xl font-semibold text-gray-900">
          Aviso
        </h1>
        <p id="app-blocker-description" class="mt-4 text-base leading-7 text-gray-700">
          Favor de usar
          <a
            :href="redirectUrl"
            class="font-semibold text-blue-600 underline underline-offset-4"
          >
            https://lista-peligro.vercel.app/
          </a>
        </p>
      </div>
    </div>
  </div>
</template>
