import { reactive } from 'vue';

export type BreadCrumbItem = {
    label: string,
    navigateTo: string,
    params: {
        [key: string]: string
    } | null,
    index: number
};
export type Tstore = {
    context: string | null,
    namespace: string | null,
    breadcrumbItems: BreadCrumbItem[],
    theme: string | null, // Added theme property
}
export const globalStore = reactive<Tstore>({
    context: null,
    namespace: null,
    breadcrumbItems:[],
    theme: '1', // Initialize with a default theme value (e.g., '1' for light, or based on VSCode default)
});
