(() => {
    const STORAGE_KEY = "theme-preference";
    const THEME_LIGHT = "light";
    const THEME_DARK = "dark";
    const DEFAULT_THEME = THEME_DARK;

    const getStoredTheme = () => {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }
    };

    const setStoredTheme = (theme) => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (error) {
            // Storage might be unavailable; silently ignore.
        }
    };

    const applyTheme = (theme) => {
        const safeTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
        document.documentElement.setAttribute("data-theme", safeTheme);
    };

    const initialiseTheme = () => {
        const stored = getStoredTheme();
        applyTheme(stored || DEFAULT_THEME);
    };

    const toggleTheme = () => {
        const current = document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
        const next = current === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        applyTheme(next);
        setStoredTheme(next);
        updateToggleLabel(next);
    };

    const updateToggleLabel = (theme) => {
        const toggleButton = document.getElementById("theme-toggle");
        if (!toggleButton) {
            return;
        }

        const isDark = theme === THEME_DARK;
        toggleButton.setAttribute("aria-pressed", isDark ? "true" : "false");
        toggleButton.setAttribute("title", isDark ? "Switch to light mode" : "Switch to dark mode");
        toggleButton.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
    };

    initialiseTheme();

    document.addEventListener("DOMContentLoaded", () => {
        updateToggleLabel(document.documentElement.getAttribute("data-theme") || DEFAULT_THEME);
        const toggleButton = document.getElementById("theme-toggle");
        if (toggleButton) {
            toggleButton.addEventListener("click", toggleTheme);
        }
    });
})();
