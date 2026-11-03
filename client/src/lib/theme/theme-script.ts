export const THEME_STORAGE_KEY = "relay-theme";
export const DARK_QUERY = "(prefers-color-scheme: dark)";

/**
 * Inline script for <head>: applies the saved theme before first paint so the page never
 * flashes the wrong colors. Mirrors the logic in theme.ts.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var d=p==="dark"||(p!=="light"&&matchMedia("${DARK_QUERY}").matches);document.documentElement.dataset.theme=d?"dark":"light"}catch(e){}})()`;
