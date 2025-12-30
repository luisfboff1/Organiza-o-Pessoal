'use client';

import { useEffect, useMemo } from 'react';
import '@blocknote/core/fonts/inter.css';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/shadcn/style.css';
import { useDebouncedCallback } from 'use-debounce';
import { updatePage } from '../actions/update-page';
import { blocksToPlainText } from '../lib/block-to-text';
import { blockSpecs } from '../lib/spreadsheet-block-schema';

interface PageEditorProps {
  pageId: string;
  workspaceId: string;
  initialContent?: any;
}

export function PageEditor({ pageId, workspaceId, initialContent }: PageEditorProps) {
  const editor = useCreateBlockNote({
    initialContent: initialContent && initialContent.length > 0
      ? initialContent
      : undefined,
    blockSpecs,
  });

  // Autosave com debounce de 1000ms
  const saveContent = useDebouncedCallback(async (blocks: any) => {
    const contentText = blocksToPlainText(blocks);

    try {
      await updatePage({
        pageId,
        workspaceId,
        contentJson: blocks,
        contentText,
      });
    } catch (error) {
      console.error('Erro ao salvar:', error);
    }
  }, 1000);

  // Listen para mudanças no editor
  useEffect(() => {
    const handleChange = () => {
      const blocks = editor.document;
      saveContent(blocks);
    };

    editor.onChange(handleChange);
  }, [editor, saveContent]);

  return (
    <div className="w-full">
      <BlockNoteView
        editor={editor}
        theme="light"
        className="min-h-screen"
      />
    </div>
  );
}
