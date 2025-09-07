<template>
  <div class="container">
    <nav class="nav">
      <strong>Apothecary</strong>
      <RouterLink to="/mining">采矿</RouterLink>
      <RouterLink to="/alchemy">炼药</RouterLink>
      <span class="stat" style="margin-left:auto">仓库：
        <span class="badges">
          <span class="badge" v-for="t in ORE_TYPES" :key="t">{{ t }} × {{ inventory[t] || 0 }}</span>
        </span>
      </span>
    </nav>
    <RouterView />
  </div>
  
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useInventoryStore, ORE_TYPES } from './store/inventory.js';

const inv = useInventoryStore();
const { inventory } = storeToRefs(inv);
</script>
