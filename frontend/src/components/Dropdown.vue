<template>
    <div class="relative w-full max-w-lg">
      <select
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="w-full h-10 px-4 py-2 text-lg border-2 border-gray-300 rounded-md outline-none transition-all duration-300 focus:border-green-500 focus:ring-2 focus:ring-green-300"
      >
        <option
          v-if="defaultOption"
          :value="defaultOption.value"
          disabled
        >
          {{ defaultOption.label }}
        </option>
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
    </div>
  </template>
  
  <script setup>
  import { defineProps } from 'vue';
  
  // Define props for the component
  defineProps({
    modelValue: {
      type: String,
      required: true, // Ensures a v-model binding is provided
    },
    options: {
      type: Array,
      required: true, // Requires an array of dropdown options
    },
    defaultOption: {
      type: Object,
      default: null, // Optional default placeholder
    },
  });
  </script>
  