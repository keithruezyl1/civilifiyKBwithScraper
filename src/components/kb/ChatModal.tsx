import React from 'react';
import Modal from '../Modal/Modal';
import { askChat } from '../../services/chatApi';
import { Send, Copy, Trash2, Loader2, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  ts: number;
};

export default function ChatModal({ isOpen, onClose }: Props) {
  const [question, setQuestion] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [sources, setSources] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [showSources, setShowSources] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // Load/persist conversation
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('villy_chat_history');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('villy_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  React.useEffect(() => {
    try {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }, [messages, loading]);

  const submit = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setSources([]);

    const userMsg: Message = { id: `${Date.now()}`, role: 'user', content: q, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion('');

    const resp = await askChat(q);
    if (resp.error) setError(resp.error);
    const assistantMsg: Message = {
      id: `${Date.now() + 1}`,
      role: 'assistant',
      content: resp.answer || '',
      ts: Date.now() + 1,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setSources(resp.sources || []);
    setLoading(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setSources([]);
    setError(null);
    try { localStorage.removeItem('villy_chat_history'); } catch {}
  };

  const copyLastAnswer = async () => {
    try {
      const last = [...messages].reverse().find((m) => m.role === 'assistant');
      if (last) await navigator.clipboard.writeText(last.content);
    } catch {}
  };

  const copyMessage = async (content: string) => {
    try { await navigator.clipboard.writeText(content); } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ask Villy (RAG)" subtitle={null}>
      <div className="space-y-3">
        <div ref={scrollRef} className="rounded-md border bg-gray-50 max-h-[50vh] overflow-auto p-3">
          {messages.length === 0 && (
            <div className="text-sm text-gray-500 text-center py-10">Start by asking a question</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] whitespace-pre-wrap text-sm p-2 rounded-md border bg-white shadow-sm ${m.role === 'user' ? 'bg-blue-50 border-blue-200' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">{m.content}</div>
                  <button
                    className="opacity-60 hover:opacity-100"
                    title="Copy"
                    onClick={() => copyMessage(m.content)}
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="animate-spin" size={14} />
              Thinking…
            </div>
          )}
        </div>

        <div className="space-y-2">
          <textarea
            className="kb-input"
            rows={3}
            placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={loading}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button className="modal-button" onClick={submit} disabled={loading || !question.trim()}>
              {loading ? (
                <span className="inline-flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Asking…</span>
              ) : (
                <span className="inline-flex items-center gap-2"><Send size={16} /> Ask</span>
              )}
            </button>
            <button className="modal-button cancel" onClick={onClose}>Close</button>
            <button className="modal-button cancel" onClick={clearConversation} disabled={messages.length === 0}>
              <span className="inline-flex items-center gap-2"><Trash2 size={16} /> Clear</span>
            </button>
            <button className="modal-button cancel" onClick={copyLastAnswer} disabled={!messages.some((m) => m.role === 'assistant')}>
              <span className="inline-flex items-center gap-2"><Copy size={16} /> Copy last answer</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {sources && sources.length > 0 && (
          <div className="space-y-2">
            <button
              className="w-full flex items-center justify-between text-left text-sm font-semibold"
              onClick={() => setShowSources((s) => !s)}
            >
              <span>Sources ({sources.length})</span>
              {showSources ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            {showSources && (
              <ul className="space-y-2 text-sm">
                {sources.map((s, i) => (
                  <li key={i} className="p-3 rounded border bg-white">
                    <div className="font-medium">{s.title} {s.type ? `(${s.type})` : ''}</div>
                    {s.canonical_citation && <div className="text-gray-600">{s.canonical_citation}</div>}
                    {s.summary && <div className="text-gray-700 mt-1">{s.summary}</div>}
                    <div className="mt-2">
                      <a href={`/entry/${encodeURIComponent(s.entry_id)}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                        <ExternalLink size={14} /> View entry
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

