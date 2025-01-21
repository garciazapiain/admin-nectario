<template>
    <div>
      <h1 class="flex justify-start pl-3 bg-white text-black">{{ title }}</h1>
      <table class="table">
        <thead>
          <tr>
            <th v-for="(header, index) in headers" :key="index" class="border p-2">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="index"
            :class="rowClass(row)"
            draggable="true"
            @dragstart="onDragStart(row, $event)"
            @touchstart="onDragStart(row, $event)"
          >
            <td v-for="(cell, i) in row" :key="i" class="border p-2" :class="cellClass(cell, i)">
              <span v-if="i === 0 && cell.icon" class="cursor-pointer" @click="onActionClick(cell, row)">
                ☰
              </span>
              <span v-else>{{ cell.value }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue';
  
  defineProps({
    title: {
      type: String,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    rows: {
      type: Array,
      required: true,
    },
    rowClass: {
      type: Function,
      default: () => '',
    },
    cellClass: {
      type: Function,
      default: () => '',
    },
    onDragStart: {
      type: Function,
      default: () => {},
    },
    onActionClick: {
      type: Function,
      default: () => {},
    },
  });
  </script>
  
  <style scoped>
  .table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .table th,
  .table td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  </style>
  