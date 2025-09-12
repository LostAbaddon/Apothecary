<template>
  <div class="row">
    <div class="col">
      <div class="panel">
        <h2>行囊</h2>
        <p class="stat">查看当前行囊中的矿石库存。</p>
        <div class="badges" style="margin:8px 0">
          <span
            class="badge"
            v-for="([name, cnt], i) in entries"
            :key="name + '-' + i"
          >{{ name }} × {{ cnt || 0 }}</span>
        </div>
        <p class="stat">合计：{{ total }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useInventoryStore } from '../store/inventory.js';

const inv = useInventoryStore();
const { inventory } = storeToRefs(inv);
const entries = computed(() => Object.entries(inventory.value));
const total = computed(()=> Object.values(inventory.value).reduce((a,b)=> a + (b||0), 0));
</script>