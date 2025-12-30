'use client';

import { useChat } from 'ai/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { use } from 'react';

export default function ChatPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai/chat',
    body: { workspaceId },
  });

  return (
    <div className="flex flex-col h-screen">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Agente Inteligente</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-4 rounded-lg ${
              m.role === 'user'
                ? 'bg-blue-100 dark:bg-blue-900 ml-auto max-w-2xl'
                : 'bg-slate-100 dark:bg-slate-800 mr-auto max-w-2xl'
            }`}
          >
            <div className="font-semibold mb-1">
              {m.role === 'user' ? 'Você' : 'Agente'}
            </div>
            <div className="whitespace-pre-wrap">{m.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg max-w-2xl">
            <div className="font-semibold mb-1">Agente</div>
            <div>Pensando...</div>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Pergunte ao agente..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>
            Enviar
          </Button>
        </form>
      </div>
    </div>
  );
}
