<template>
  <div class="container">
    <nav class="nav">
      <strong>Apothecary</strong>
      <RouterLink to="/map">地图</RouterLink>
      <RouterLink to="/alchemy">炼药</RouterLink>
      <RouterLink to="/inventory">仓库</RouterLink>
    </nav>
    <RouterView v-slot="{ Component }">
      <KeepAlive include="MapView">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
  
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>
