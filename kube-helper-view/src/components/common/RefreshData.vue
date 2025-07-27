<template>
    <div class="d-flex align-items-center mx-2">
        <Button class="me-2" v-if="!isAutoRefresh" icon="pi pi-refresh" size="small" rounded 
        aria-label="Refresh Data" @click="reloadData" />
        <div class="flex items-center">
          <Checkbox inputId="auto-refresh" v-model="isAutoRefresh" binary />
          <label for="auto-refresh"> Auto Refresh </label>
        </div>
    </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';


const inputprops = defineProps({
  reloadFunction: {
    type: Function,
    required: true
  }
});

const timer = ref<NodeJS.Timeout | null>(null);
const isAutoRefresh = ref(false);


watch(isAutoRefresh, (newVal) => {
  if(newVal){
    timer.value = setInterval(() => {
      inputprops.reloadFunction();
    }, 5000);
  }else{
    if(timer.value){
      clearInterval(timer.value);
      timer.value = null;
    }
  }
});


onUnmounted(() => {
  if(timer.value){
    clearInterval(timer.value);
  }
});


const reloadData = () => {
  inputprops.reloadFunction();
}
</script>