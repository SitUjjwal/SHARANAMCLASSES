/**
 * Admin Chat Support — inbox + reply thread.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import type {
  AdminSupportConversation,
  SupportChatMessage,
} from '@sharanam/shared';

import { PageHeader } from '@/components/PageHeader';
import {
  fetchAdminSupportChat,
  listAdminSupportChats,
  markAdminSupportRead,
  sendAdminSupportMessage,
  setAdminSupportTyping,
} from '@/features/support-chat/api';
import { ApiClientError } from '@/services/api';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function SupportChatPage() {
  const [inbox, setInbox] = useState<AdminSupportConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadInbox = useCallback(async () => {
    try {
      setInbox(await listAdminSupportChats());
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else if (err instanceof TypeError) {
        setError('Cannot reach API. Start apps/api (port 4000).');
      } else setError('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadThread = useCallback(async (id: string) => {
    try {
      const data = await fetchAdminSupportChat(id);
      setMessages(data.messages);
      setStudentName(data.student_name);
      await markAdminSupportRead(id);
      await loadInbox();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load thread');
    }
  }, [loadInbox]);

  useEffect(() => {
    void loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!selectedId) return;
    void loadThread(selectedId);
    pollRef.current = setInterval(() => {
      void loadThread(selectedId);
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selectedId, loadThread]);

  async function onSelect(id: string) {
    setSelectedId(id);
    setError(null);
  }

  async function onDraftChange(value: string) {
    setDraft(value);
    if (!selectedId) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    try {
      await setAdminSupportTyping(selectedId, true);
    } catch {
      // ignore typing errors
    }
    typingTimer.current = setTimeout(() => {
      if (selectedId) {
        void setAdminSupportTyping(selectedId, false);
      }
    }, 2500);
  }

  async function onSend() {
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await setAdminSupportTyping(selectedId, false);
      const msg = await sendAdminSupportMessage(selectedId, draft.trim());
      setMessages((prev) => [...prev, msg]);
      setDraft('');
      await loadInbox();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Chat Support"
        description="Reply to student chats. Typing indicator is shown to students while you compose."
      />

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="hint">Loading…</p> : null}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
          gap: 16,
          minHeight: 480,
          marginTop: 16,
        }}
      >
        <div className="table-wrap" style={{ maxHeight: 640, overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Unread</th>
              </tr>
            </thead>
            <tbody>
              {inbox.length === 0 ? (
                <tr>
                  <td colSpan={2}>
                    <span className="hint">No conversations yet.</span>
                  </td>
                </tr>
              ) : (
                inbox.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => void onSelect(c.id)}
                    style={{
                      cursor: 'pointer',
                      background:
                        selectedId === c.id ? 'rgba(201,162,39,0.15)' : undefined,
                    }}
                  >
                    <td>
                      <div>{c.student_name}</div>
                      <div className="hint">
                        {c.last_message_preview || 'No messages'}
                      </div>
                      <div className="hint">{formatTime(c.last_message_at)}</div>
                    </td>
                    <td>
                      {c.unread_count > 0 ? (
                        <strong>{c.unread_count}</strong>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            border: '1px solid var(--border, #ddd)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            minHeight: 480,
          }}
        >
          {!selectedId ? (
            <p className="hint">Select a conversation to reply.</p>
          ) : (
            <>
              <h3 style={{ margin: 0 }}>{studentName}</h3>
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 420,
                }}
              >
                {messages.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: m.from_support ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      padding: '8px 12px',
                      borderRadius: 12,
                      background: m.from_support ? '#C9A227' : 'rgba(0,0,0,0.06)',
                      color: m.from_support ? '#0B1F3A' : 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                      {m.from_support ? 'You' : 'Student'} · {formatTime(m.created_at)}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                  </div>
                ))}
              </div>
              <textarea
                rows={3}
                value={draft}
                onChange={(e) => void onDraftChange(e.target.value)}
                placeholder="Type a reply…"
                style={{ width: '100%', resize: 'vertical' }}
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={sending || !draft.trim()}
                onClick={() => void onSend()}
              >
                {sending ? 'Sending…' : 'Send reply'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
