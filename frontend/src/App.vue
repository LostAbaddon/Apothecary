<template>
  <div class="container">
    <nav class="nav" :class="{ disabled: inDungeon }">
      <strong>求道的蜿蜒长路</strong>
      <RouterLink to="/sect" :tabindex="inDungeon ? -1 : 0" :aria-disabled="inDungeon ? 'true' : 'false'">宗门</RouterLink>
      <RouterLink to="/map" :tabindex="inDungeon ? -1 : 0" :aria-disabled="inDungeon ? 'true' : 'false'">福地寻秘</RouterLink>
      <RouterLink to="/inventory" :tabindex="inDungeon ? -1 : 0" :aria-disabled="inDungeon ? 'true' : 'false'">行囊</RouterLink>
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
