<template>
    <button :class="[bgColor, textColor, fontSize, 'w-fit h-fit m-1 py-3.5 px-5 font-bold border-white rounded-md cursor-pointer transition duration-200']">
      <slot></slot>
    </button>
  </template>
  
  <script setup>
  const props = defineProps({
    bgColor: { type: String, default: 'bg-blue-500' },
    textColor: { type: String, default: 'text-white' },
    fontSize: { type: String, default: 'text-lg' },
  });
  </script>
  