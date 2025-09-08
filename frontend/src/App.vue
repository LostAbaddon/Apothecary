<template>
  <div class="container">
    <nav class="nav">
      <strong>Apothecary</strong>
      <RouterLink to="/mining">采矿</RouterLink>
      <RouterLink to="/alchemy">炼药</RouterLink>
      <RouterLink to="/inventory">仓库</RouterLink>
    </nav>
    <RouterView />
  </div>
  
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>
