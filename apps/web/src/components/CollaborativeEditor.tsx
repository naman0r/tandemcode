import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { WS_BASE_URL } from "../lib/config";

interface Props {
  roomId: string;
  language: string;
  starterCode?: string | null;
  onCodeChange: (code: string) => void;
}

const MONACO_LANGUAGE: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  java: "java",
};

const WS_URL = `${WS_BASE_URL}/ws/yjs`;

type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

// Clerk session tokens last about a minute. y-websocket re-reads provider.params
// every time it dials, so refreshing well inside that window is what lets a
// dropped connection come back instead of failing the handshake forever.
const TOKEN_REFRESH_MS = 30_000;

const CollaborativeEditor = ({
  roomId,
  language,
  starterCode,
  onCodeChange,
}: Props) => {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  // Held in a ref so that a fresh getToken identity from Clerk cannot re-run the
  // effect below and tear down the shared document mid-session.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const editorRef = useRef<MonacoEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const starterCodeRef = useRef(starterCode);
  starterCodeRef.current = starterCode;

  // The relay keeps no document, so a room's text lives only in its peers. The
  // starter code goes in when the shared text is empty after sync, which is
  // the first person to arrive with a problem assigned. Any later arrival
  // syncs their text instead and leaves it alone. Once per document: a
  // reconnect after someone cleared the editor must not put it back.
  const seededRef = useRef(false);
  const seedStarterCode = (ydoc: Y.Doc) => {
    const starter = starterCodeRef.current;
    const ytext = ydoc.getText("code");
    if (starter && !seededRef.current && ytext.length === 0) {
      seededRef.current = true;
      ytext.insert(0, starter);
    }
  };

  // Creates (or recreates) the MonacoBinding once both the editor and the
  // Yjs provider are ready. Called from both handleMount and the provider
  // useEffect so that React StrictMode's double-invocation is handled:
  //   - Normal:      provider created → editor mounts → binding made in handleMount
  //   - StrictMode:  provider destroyed+recreated → editor already mounted
  //                  → binding recreated here in the effect
  const createBinding = (
    ydoc: Y.Doc,
    provider: WebsocketProvider,
    editor: MonacoEditor
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
  // y-websocket connects to our relay at /ws/yjs/{roomId}, which forwards
  // binary Yjs messages to all other sessions in the room. The relay rejects
  // the handshake without a valid session token, which is why the connection
  // cannot be opened until getToken resolves.
  useEffect(() => {
    if (!roomId || !isLoaded || !isSignedIn) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    seededRef.current = false;

    let cancelled = false;
    let refresh: ReturnType<typeof setInterval> | undefined;

    const connect = async () => {
      const token = await getTokenRef.current();
      if (cancelled || !token) return;

      const provider = new WebsocketProvider(WS_URL, roomId, ydoc, {
        params: { token },
      });
      providerRef.current = provider;
      provider.on("sync", (synced: boolean) => {
        if (synced) seedStarterCode(ydoc);
      });

      refresh = setInterval(async () => {
        const next = await getTokenRef.current();
        if (next) {
          provider.params.token = next;
        }
      }, TOKEN_REFRESH_MS);

      // StrictMode re-run: editor is already mounted, recreate binding now.
      if (editorRef.current) {
        createBinding(ydoc, provider, editorRef.current);
      }
    };

    connect();

    return () => {
      cancelled = true;
      clearInterval(refresh);
      bindingRef.current?.destroy();
      bindingRef.current = null;
      providerRef.current?.destroy();
      providerRef.current = null;
      ydoc.destroy();
      ydocRef.current = null;
    };
  }, [roomId, isLoaded, isSignedIn, sessionId]);

  useEffect(() => {
    if (ydocRef.current && providerRef.current?.synced) {
      seedStarterCode(ydocRef.current);
    }
  }, [starterCode]);

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
