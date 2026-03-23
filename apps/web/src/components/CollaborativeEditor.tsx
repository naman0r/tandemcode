import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

interface Props {
  roomId: string;
  language: string;
  onCodeChange: (code: string) => void;
}

const MONACO_LANGUAGE: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
};

const WS_URL = "ws://localhost:8080/ws/yjs";

const CollaborativeEditor = ({ roomId, language, onCodeChange }: Props) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Creates (or recreates) the MonacoBinding once both the editor and the
  // Yjs provider are ready. Called from both handleMount and the provider
  // useEffect so that React StrictMode's double-invocation is handled:
  //   - Normal:      provider created → editor mounts → binding made in handleMount
  //   - StrictMode:  provider destroyed+recreated → editor already mounted
  //                  → binding recreated here in the effect
  const createBinding = (
    ydoc: Y.Doc,
    provider: WebsocketProvider,
    editor: any
  ) => {
    bindingRef.current?.destroy();
    const ytext = ydoc.getText("code");
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;
  };

  // Initialize the Yjs doc and WebSocket provider once per roomId.
  // y-websocket connects to our Spring Boot relay at /ws/yjs/{roomId},
  // which forwards binary Yjs messages to all other sessions in the room.
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(WS_URL, roomId, ydoc);
    ydocRef.current = ydoc;
    providerRef.current = provider;

    // StrictMode re-run: editor is already mounted, recreate binding now.
    if (editorRef.current) {
      createBinding(ydoc, provider, editorRef.current);
    }

    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
      provider.destroy();
      ydoc.destroy();
      providerRef.current = null;
      ydocRef.current = null;
    };
  }, [roomId]);

  // Keep Monaco syntax highlighting in sync with the language selector
  // without recreating the model (which would break the Yjs binding).
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      monacoRef.current.editor.setModelLanguage(
        editorRef.current.getModel(),
        MONACO_LANGUAGE[language] ?? "plaintext"
      );
    }
  }, [language]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    if (ydocRef.current && providerRef.current) {
      createBinding(ydocRef.current, providerRef.current, editor);
    }

    editor.onDidChangeModelContent(() => {
      onCodeChange(editor.getValue());
    });
  };

  return (
    <div className="rounded-lg overflow-hidden">
      <Editor
        height="300px"
        defaultLanguage={MONACO_LANGUAGE[language] ?? "plaintext"}
        theme="vs-dark"
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 8, bottom: 8 },
          wordWrap: "on",
          tabSize: 4,
        }}
      />
    </div>
  );
};

export default CollaborativeEditor;
