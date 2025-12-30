import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { AI_EDITOR_PROMPTS, type AIEditorAction } from '@/lib/ai/ai-prompts';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { selectedText, action } = await req.json();

  const prompt = AI_EDITOR_PROMPTS[action as AIEditorAction];

  if (!prompt) {
    return new Response('Invalid action', { status: 400 });
  }

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    prompt: `${prompt}:\n\n${selectedText}`,
    temperature: 0.7,
  });

  return result.toDataStreamResponse();
}
