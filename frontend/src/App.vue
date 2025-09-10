<template>
  <div class="container">
    <nav class="nav" :class="{ disabled: inDungeon }">
      <strong>Apothecary</strong>
      <RouterLink to="/map" :tabindex="inDungeon ? -1 : 0" :aria-disabled="inDungeon ? 'true' : 'false'">福地</RouterLink>
      <RouterLink to="/alchemy" :tabindex="inDungeon ? -1 : 0" :aria-disabled="inDungeon ? 'true' : 'false'">祭炼</RouterLink>
      <RouterLink to="/inventory" :tabindex="inDungeon ? -1 : 0" :aria-disabled="inDungeon ? 'true' : 'false'">仓库</RouterLink>
    </nav>
    <RouterView v-slot="{ Component }">
      <KeepAlive include="MapView">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </div>
  
</template>

<script setup>
import { RouterLink, RouterView, useRoute } from 'vue-router';
import { computed } from 'vue';

const route = useRoute();
const inDungeon = computed(()=> route.path === '/mining');
</script>
