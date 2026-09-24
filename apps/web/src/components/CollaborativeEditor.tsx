import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Editor from "@monaco-editor/react";
import type { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import { WS_BASE_URL } from "../lib/config";
import { EDITOR_THEME, defineEditorTheme } from "../lib/monaco";

interface Props {
  roomId: string;
  user: { id: string; name: string };
  problemId?: string | null;
  starterCode?: string | null;
  // Only the owner can change the problem, so only the owner's client swaps
  // the text; everyone else receives the swap through the document. Two
  // clients swapping at once would merge into two copies of the starter.
  replacesOnProblemChange: boolean;
  // Whether this client may put the starter into an empty document. One
  // writer per room, for the same reason: when the owner picks a problem, a
  // partner hears about it before the owner's insert arrives, sees an empty
  // document, and would insert a second copy.
  writesStarter: boolean;
  onCodeChange: (code: string) => void;
  // The colour a user id is shown in everywhere else in the room.
  colorOf: (userId: string) => string;
}

// y-monaco tags each remote selection with the peer's Yjs client id and
// leaves the colouring to us. One stylesheet, rewritten whenever the set of
// peers or their names change. Awareness state is whatever the peer sent, so
// the colour is picked here and the name is escaped before it enters CSS.
const cursorStyles = (awareness: WebsocketProvider["awareness"], colorOf: Props["colorOf"]): string => {
  const rules: string[] = [];
  awareness.getStates().forEach((state, clientId) => {
    if (clientId === awareness.clientID || !state.user) return;
    const peer = state.user as { id?: unknown; name?: unknown };
    const name = CSS.escape(String(peer.name ?? ""));
    const color = colorOf(String(peer.id ?? clientId));
    rules.push(
      `.yRemoteSelection-${clientId} { background-color: ${color}33; }`,
      `.yRemoteSelectionHead-${clientId} { position: relative; border-left: 2px solid ${color}; }`,
      `.yRemoteSelectionHead-${clientId}::after { content: "${name}"; position: absolute; top: -1.3em; left: -2px; padding: 0 4px; font-family: "Jersey 10", monospace; font-size: 15px; line-height: 1.2em; color: #0a0a0b; background-color: ${color}; white-space: nowrap; pointer-events: none; }`,
    );
  });
  return rules.join("\n");
};

const WS_URL = `${WS_BASE_URL}/ws/yjs`;

type MonacoEditor = Parameters<OnMount>[0];

// Clerk session tokens last about a minute. y-websocket re-reads provider.params
// every time it dials, so refreshing well inside that window is what lets a
// dropped connection come back instead of failing the handshake forever.
const TOKEN_REFRESH_MS = 30_000;

const CollaborativeEditor = ({
  roomId,
  user,
  problemId,
  starterCode,
  replacesOnProblemChange,
  writesStarter,
  onCodeChange,
  colorOf,
}: Props) => {
  const { getToken, isLoaded, isSignedIn, sessionId } = useAuth();
  // Held in a ref so that a fresh getToken identity from Clerk cannot re-run the
  // effect below and tear down the shared document mid-session.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const editorRef = useRef<MonacoEditor | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const [peerStyles, setPeerStyles] = useState("");
  // Same reason as getTokenRef: a new user object must not rebuild the document.
  const userRef = useRef(user);
  userRef.current = user;
  const colorOfRef = useRef(colorOf);
  colorOfRef.current = colorOf;
  const starterCodeRef = useRef(starterCode);
  starterCodeRef.current = starterCode;
  const writesStarterRef = useRef(writesStarter);
  writesStarterRef.current = writesStarter;

  // The relay keeps no document, so a room's text lives only in its peers. The
  // starter code goes in when the shared text is empty after sync, which is
  // the first person to arrive with a problem assigned. Any later arrival
  // syncs their text instead and leaves it alone. Once per document: a
  // reconnect after someone cleared the editor must not put it back.
  const seededRef = useRef(false);
  // The problem the text was written for. Switching problems replaces the
  // text with the new starter, since code for the old problem is no use.
  const shownProblemRef = useRef<string | null>(null);
  const seedStarterCode = (ydoc: Y.Doc) => {
    const starter = starterCodeRef.current;
    const ytext = ydoc.getText("code");
    if (starter && writesStarterRef.current && !seededRef.current && ytext.length === 0) {
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
    editor: MonacoEditor,
  ) => {
    bindingRef.current?.destroy();
    const ytext = ydoc.getText("code");
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness,
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
    shownProblemRef.current = null;

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
      provider.awareness.setLocalStateField("user", {
        id: userRef.current.id,
        name: userRef.current.name,
      });
      provider.awareness.on("change", () =>
        setPeerStyles(cursorStyles(provider.awareness, colorOfRef.current)),
      );

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
    const previous = shownProblemRef.current;
    shownProblemRef.current = problemId ?? null;
    const ydoc = ydocRef.current;
    if (!ydoc || !providerRef.current?.synced) return;

    if (replacesOnProblemChange && previous && problemId && previous !== problemId && starterCode) {
      const ytext = ydoc.getText("code");
      ydoc.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, starterCode);
      });
      seededRef.current = true;
      return;
    }
    seedStarterCode(ydoc);
  }, [problemId, starterCode, replacesOnProblemChange, writesStarter]);

  // The roster decides colours, so a join or leave can recolour a cursor.
  useEffect(() => {
    const provider = providerRef.current;
    if (provider) setPeerStyles(cursorStyles(provider.awareness, colorOf));
  }, [colorOf]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;

    if (ydocRef.current && providerRef.current) {
      createBinding(ydocRef.current, providerRef.current, editor);
    }

    editor.onDidChangeModelContent(() => {
      onCodeChange(editor.getValue());
    });
  };

  return (
    <>
      <style>{peerStyles}</style>
      <Editor
        height="420px"
        defaultLanguage="python"
        theme={EDITOR_THEME}
        beforeMount={defineEditorTheme}
        onMount={handleMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          wordWrap: "on",
          tabSize: 4,
        }}
      />
    </>
  );
};

export default CollaborativeEditor;
