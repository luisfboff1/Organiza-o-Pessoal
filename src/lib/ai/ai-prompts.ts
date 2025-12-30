export const AI_EDITOR_PROMPTS = {
  rewrite: 'Reescreva o seguinte texto de forma mais clara e concisa',
  summarize: 'Resuma o seguinte texto em 2-3 frases',
  improve: 'Melhore a qualidade de escrita do seguinte texto',
  expand: 'Expanda o seguinte texto com mais detalhes e exemplos',
  extract_tasks: 'Extraia tarefas acionáveis do seguinte texto e retorne como lista'
} as const;

export type AIEditorAction = keyof typeof AI_EDITOR_PROMPTS;
