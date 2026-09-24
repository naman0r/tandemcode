import type { BeforeMount } from "@monaco-editor/react";

export const EDITOR_THEME = "tandem";

// vs-dark on the page's charcoal, so the editor sits flush inside its card.
export const defineEditorTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#101013",
      "editor.lineHighlightBackground": "#18181b",
      "editorLineNumber.foreground": "#52525b",
      "editorLineNumber.activeForeground": "#a1a1aa",
      "editorCursor.foreground": "#f97316",
      "editor.selectionBackground": "#f9731640",
    },
  });
};
