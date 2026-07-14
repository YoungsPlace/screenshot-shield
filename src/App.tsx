import { useRef, useState } from 'react';
import { MarketingLanding } from './marketing';
import { ScreenshotEditor } from './editor/ScreenshotEditor';

export default function App() {
  const editorRef = useRef<HTMLElement | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const revealEditor = () => setEditorOpen(true);
  const focusEditor = () => {
    revealEditor();
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        const picker = editorRef.current?.querySelector<HTMLButtonElement>('button, [href], input');
        picker?.focus();
      }, 100);
    });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#editor-app" onClick={revealEditor}>
        Skip to editor
      </a>
      <MarketingLanding onStartEditing={focusEditor} />
      <main ref={editorRef} id="editor-app" hidden={!editorOpen} onChange={revealEditor}>
        <ScreenshotEditor />
      </main>
    </div>
  );
}
