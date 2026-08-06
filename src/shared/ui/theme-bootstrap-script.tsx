const script = `
(function () {
  try {
    var raw = localStorage.getItem("travel-explorer-settings");
    var theme = raw ? JSON.parse(raw).state.theme : "system";
    var resolved = theme === "dark" || theme === "light"
      ? theme
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = resolved;
  } catch (e) {}
})();
`;

export function ThemeBootstrapScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
