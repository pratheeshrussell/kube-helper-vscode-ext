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
    breadcrumbItems: BreadCrumbItem[]
}
export const globalStore = reactive<Tstore>({
    context: null,
    namespace: null,
    breadcrumbItems:[]
});
