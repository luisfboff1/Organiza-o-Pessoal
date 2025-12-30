import { EMBEDDINGS_CHUNK_SIZE } from '@/lib/constants';

export function chunkText(text: string, maxTokens: number = EMBEDDINGS_CHUNK_SIZE): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const sentences = text.split(/[.!?]\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const tokens = estimateTokens(currentChunk + ' ' + sentence);

    if (tokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
