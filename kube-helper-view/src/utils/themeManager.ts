export const ThemeManager = {
    setTheme: (themeKind: string) => {
        const root = document.getElementsByTagName('html')[0];
        if (themeKind === '2' || themeKind === '3') {
            root.classList.add('dark-kube');
        } else {
            root.classList.remove('dark-kube');
        }
    }
};