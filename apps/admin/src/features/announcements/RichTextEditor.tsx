/**
 * Lightweight rich-text editor (no TipTap dependency).
 * Stores HTML; toolbar: bold, italic, underline, lists, link.
 */
import { useEffect, useRef } from 'react';

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write announcement…',
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  function run(command: string, arg?: string) {
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  }

  return (
    <div className="rich-text">
      <div className="rich-text-toolbar" role="toolbar" aria-label="Formatting">
        <button type="button" onClick={() => run('bold')} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => run('italic')} title="Italic">
          <em>I</em>
        </button>
        <button type="button" onClick={() => run('underline')} title="Underline">
          <u>U</u>
        </button>
        <button type="button" onClick={() => run('insertUnorderedList')} title="Bullet list">
          • List
        </button>
        <button type="button" onClick={() => run('insertOrderedList')} title="Numbered list">
          1. List
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Link URL');
            if (url) run('createLink', url);
          }}
          title="Link"
        >
          Link
        </button>
      </div>
      <div
        ref={ref}
        className="rich-text-editor"
        contentEditable
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={() => {
          if (ref.current) onChange(ref.current.innerHTML);
        }}
      />
    </div>
  );
}
