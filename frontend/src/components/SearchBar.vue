<template>
    <div class="flex justify-center my-5">
      <div class="relative w-full max-w-lg">
        <span class="ml-2 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
          🔍
        </span>
        <input 
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :placeholder="placeholder" 
          class="w-full h-10 px-10 py-2 text-lg border-2 border-gray-300 rounded-full outline-none transition-all duration-300 focus:border-green-500 focus:ring-2 focus:ring-green-300"
        />
      </div>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue';
  
  defineProps({
    modelValue: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: 'Search...',
    },
  });
  </script>
  