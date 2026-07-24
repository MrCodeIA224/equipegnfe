'use client';

import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { usePolling } from '@/hooks/usePolling';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  body: string;
  created_at: string;
}

interface ChatPanelProps {
  orderType: 'DELIVERY' | 'MARKET' | 'MARKETPLACE';
  orderId: number;
}

export default function ChatPanel({ orderType, orderId }: ChatPanelProps) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.open(orderType, orderId)
      .then((res) => setConversationId(res.data.id))
      .catch(() => setError("Le chat n'est pas encore disponible pour cette commande."));
  }, [orderType, orderId]);

  usePolling(() => {
    if (!conversationId) return;
    chatApi.getMessages(conversationId).then((res) => {
      setMessages(res.data.results ?? res.data);
    }).catch(() => {});
  }, 10000, !!conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!conversationId || !body.trim() || sending) return;
    setSending(true);
    chatApi.sendMessage(conversationId, body.trim())
      .then((res) => {
        setMessages((prev) => [...prev, res.data]);
        setBody('');
      })
      .finally(() => setSending(false));
  };

  if (error) {
    return <p className="text-sm text-gray-500">{error}</p>;
  }

  if (!conversationId) {
    return <p className="text-sm text-gray-500">Chargement de la conversation...</p>;
  }

  return (
    <div className="flex flex-col border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex-1 max-h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun message pour l&apos;instant.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                m.sender === user?.id
                  ? 'ml-auto bg-primary-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              )}
            >
              <p>{m.body}</p>
              <p className={cn('text-[10px] mt-1', m.sender === user?.id ? 'text-primary-100' : 'text-gray-400')}>
                {new Date(m.created_at).toLocaleTimeString('fr-FR')}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex items-center gap-2 p-2 border-t border-gray-200 bg-white">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Écrire un message..."
          className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="p-2 rounded-full bg-primary-500 text-white disabled:opacity-50"
          aria-label="Envoyer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
