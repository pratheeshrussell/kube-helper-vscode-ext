<script setup lang="ts">
import { onMounted } from 'vue';
import { ThemeManager } from './utils/themeManager';
import { useRouter } from 'vue-router';

const router = useRouter();
window.addEventListener('message', (event) => {
  if(event.data.type == "onThemeChange"){
    ThemeManager.setTheme(event.data.value);
  }
})

onMounted(() => {
  const body=document.getElementsByTagName('body')[0];
  if(body){
    const curpage = body.getAttribute('data-page') ?? 'sidebar';
    const curtheme = body.getAttribute('data-theme') ?? '1';
    ThemeManager.setTheme(curtheme);
    router.push({name: curpage});
  }
})
</script>

<template>
  <RouterView />
</template>

<style>

</style>
