<template>
    <div class="d-flex align-items-center mx-2">
        <Button icon="pi pi-refresh" size="small" rounded 
        aria-label="Refresh Data" @click="reloadData" />
    </div>
</template>

<script setup lang="ts">

const inputprops = defineProps({
  reloadFunction: {
    type: Function,
    required: true
  }
});

const reloadData = () => {
  inputprops.reloadFunction();
}
</script>