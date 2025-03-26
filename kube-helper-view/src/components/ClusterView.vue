<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Breadcrumb from 'primevue/breadcrumb';
import type { MenuItem, MenuItemCommandEvent } from 'primevue/menuitem';
import { globalStore } from '../store/store';


const router = useRouter();
const showBreadcrumb = ref(false);

const breacrumbClicked = (e:MenuItemCommandEvent) => {
    console.log("breadcrumb clicked", JSON.stringify(e.item), );
    if(Object.prototype.hasOwnProperty.call(e.item,'navigateTo')){
        if(e.item.navigateTo != router.currentRoute.value.name){
            let params = e.item.params == null ? {} : e.item.params;
            router.push({name: e.item.navigateTo, params: params});
        }
        if(e.item.index > -1){
            globalStore.breadcrumbItems.splice(e.item.index + 1);
        }else{
            globalStore.breadcrumbItems = [];
        }
    }
}
const home = ref<MenuItem>({
    icon: 'pi pi-home',
    command: breacrumbClicked,
    navigateTo: 'clusteroverview',
    params: null,
    index: -1
});
const breadcrumbMenuitems = ref<MenuItem[]>([]);

watch(() => globalStore.breadcrumbItems, (newValue, _oldValue) => {
  // conditionally show breadcrumbs
  if(newValue.length < 1){
    showBreadcrumb.value = false;
  }else{
    showBreadcrumb.value = true;
  }

  // Generate Breadcrumb items
  const breadcrumbitems:MenuItem[] = [];
  for(const item of newValue){
    breadcrumbitems.push({
        label: item.label,
        command: breacrumbClicked,
        navigateTo: item.navigateTo,
        params: item.params,
        index: item.index
    });
  }
  breadcrumbMenuitems.value = [...breadcrumbitems];
}, { deep: true });


</script>

<template>
    <div class="flex justify-center" v-if="showBreadcrumb">
        <Breadcrumb :home="home" :model="breadcrumbMenuitems" />
    </div>
    <RouterView />
</template>