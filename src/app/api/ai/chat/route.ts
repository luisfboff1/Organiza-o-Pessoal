import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { agentTools } from '@/features/agent/tools';
import { searchSimilar } from '@/features/embeddings/lib/vector-search';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages, workspaceId } = await req.json();

  // RAG: Buscar contexto relevante
  const lastMessage = messages[messages.length - 1].content;
  const context = await searchSimilar(workspaceId, lastMessage, 5);

  const systemPrompt = `Você é um assistente inteligente para um workspace pessoal tipo Notion.

CONTEXTO RELEVANTE DO WORKSPACE:
${context.map((c: any) => `- ${c.chunk_text}`).join('\n')}

Você tem acesso a ferramentas para criar páginas, projetos, tarefas e lançamentos financeiros.
Sempre cite as fontes quando usar informações do contexto.
Seja conciso e útil.`;

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    messages,
    tools: agentTools,
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
