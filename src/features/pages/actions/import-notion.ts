/**
 * Server Actions para importação do Notion
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import { parseNotionZip } from '../lib/notion-parser';
import { convertNotionPageToBlocks, blocksToPlainText } from '../lib/markdown-to-blocknote';
import { NotionPage, NotionImportJob, NotionImportError } from '../types/notion';
import { ImportResult, ImportError, PageInsert } from '../types';

// =====================================================
// MAIN IMPORT FUNCTION
// =====================================================

/**
 * Inicia importação de um arquivo ZIP do Notion
 */
export async function importNotionZip(data: {
  workspaceId: string;
  zipFile: File;
  parentId?: string | null;
}): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // 1. Validar arquivo
    if (!data.zipFile.name.endsWith('.zip')) {
      return { success: false, error: 'Arquivo deve ser um ZIP' };
    }

    if (data.zipFile.size > 100 * 1024 * 1024) {
      return { success: false, error: 'Arquivo muito grande (máximo 100MB)' };
    }

    // 2. Verificar acesso ao workspace
    const supabase = await createServerClient() as any;
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', data.workspaceId)
      .single();

    if (workspaceError || !workspace) {
      return { success: false, error: 'Workspace não encontrado' };
    }

    // 3. Gerar ID do job
    const jobId = crypto.randomUUID();

    // 4. Processar importação (inline por enquanto, pode ser background depois)
    const result = await processNotionImport({
      jobId,
      workspaceId: data.workspaceId,
      parentId: data.parentId || null,
      zipFile: data.zipFile,
    });

    return {
      success: result.success,
      jobId,
      error: result.success ? undefined : result.errors[0]?.error,
    };
  } catch (error) {
    console.error('Erro ao iniciar importação:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// =====================================================
// IMPORT PROCESSING
// =====================================================

/**
 * Processa a importação do Notion
 */
async function processNotionImport(params: {
  jobId: string;
  workspaceId: string;
  parentId: string | null;
  zipFile: File;
}): Promise<ImportResult> {
  const startTime = Date.now();
  const errors: ImportError[] = [];

  try {
    console.log(`🚀 Iniciando importação do Notion (job: ${params.jobId})`);

    // 1. Parsear ZIP
    console.log('📦 Parseando ZIP...');
    const parseResult = await parseNotionZip(params.zipFile);

    console.log(`✅ ZIP parseado: ${parseResult.pages.length} páginas, ${parseResult.assets.length} assets`);

    // Converter warnings para errors
    for (const warning of parseResult.warnings) {
      if (warning.severity === 'error') {
        errors.push({
          filePath: warning.filePath,
          error: warning.message,
          type: 'parse',
        });
      }
    }

    // 2. Criar páginas (primeira passagem - criar estrutura)
    console.log('📝 Criando páginas...');
    const pageMapping: Record<string, string> = {};

    const supabase = await createServerClient() as any;

    // Ordenar páginas por profundidade (raiz primeiro)
    const sortedPages = sortPagesByDepth(parseResult.pages);

    let importedCount = 0;
    let skippedCount = 0;

    for (const notionPage of sortedPages) {
      try {
        // Determinar parent_id
        const parentId = determineParentId(
          notionPage,
          parseResult.pages,
          pageMapping,
          params.parentId
        );

        // Converter conteúdo para BlockNote
        const blocks = await convertNotionPageToBlocks(notionPage, {
          preserveFormatting: true,
          convertSpecialBlocks: true,
          uploadAssets: false, // Assets serão processados depois
          convertInternalLinks: false, // Links serão resolvidos na segunda passagem
          workspaceId: params.workspaceId,
        });

        const contentText = blocksToPlainText(blocks);

        // Criar página
        const pageData: PageInsert = {
          workspace_id: params.workspaceId,
          parent_id: parentId,
          title: notionPage.title,
          icon: notionPage.metadata.icon || null,
          content_json: blocks as any,
          content_text: contentText,
          import_source: 'notion',
          import_metadata: {
            originalId: notionPage.metadata.originalId,
            originalPath: notionPage.filePath,
            createdAt: notionPage.metadata.createdAt,
            updatedAt: notionPage.metadata.updatedAt,
          } as any,
          is_folder: false,
          position: importedCount,
        };

        const { data: createdPage, error } = await supabase
          .from('pages')
          .insert(pageData)
          .select('id')
          .single();

        if (error) {
          console.error(`❌ Erro ao criar página ${notionPage.title}:`, error);
          errors.push({
            filePath: notionPage.filePath,
            error: error.message,
            type: 'database',
          });
          skippedCount++;
          continue;
        }

        // Adicionar ao mapeamento
        if (notionPage.metadata.originalId) {
          pageMapping[notionPage.metadata.originalId] = createdPage.id;
        }
        pageMapping[notionPage.filePath] = createdPage.id;

        importedCount++;
        console.log(`  ✓ ${notionPage.title} (${importedCount}/${sortedPages.length})`);

      } catch (error) {
        console.error(`❌ Erro ao processar ${notionPage.title}:`, error);
        errors.push({
          filePath: notionPage.filePath,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          type: 'unknown',
        });
        skippedCount++;
      }
    }

    // 3. Resolver links internos (segunda passagem)
    console.log('🔗 Resolvendo links internos...');
    await resolveInternalLinks(parseResult.pages, pageMapping);

    const duration = Date.now() - startTime;

    console.log(`✅ Importação concluída em ${duration}ms`);
    console.log(`   ${importedCount} páginas importadas`);
    console.log(`   ${skippedCount} páginas ignoradas`);
    console.log(`   ${errors.length} erros`);

    // 4. Revalidar cache
    revalidatePath(`/${params.workspaceId}/pages`);

    return {
      success: true,
      totalPages: parseResult.pages.length,
      importedPages: importedCount,
      skippedPages: skippedCount,
      errors,
      pageMapping,
      duration,
    };

  } catch (error) {
    console.error('❌ Erro fatal na importação:', error);
    return {
      success: false,
      totalPages: 0,
      importedPages: 0,
      skippedPages: 0,
      errors: [
        {
          filePath: '',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          type: 'unknown',
        },
      ],
      pageMapping: {},
      duration: Date.now() - startTime,
    };
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Ordena páginas por profundidade (raiz primeiro)
 */
function sortPagesByDepth(pages: NotionPage[]): NotionPage[] {
  return [...pages].sort((a, b) => {
    const depthA = a.filePath.split('/').length;
    const depthB = b.filePath.split('/').length;
    return depthA - depthB;
  });
}

/**
 * Determina o parent_id de uma página
 */
function determineParentId(
  page: NotionPage,
  allPages: NotionPage[],
  pageMapping: Record<string, string>,
  rootParentId: string | null
): string | null {
  // Se não tem parent path, é raiz
  if (!page.parentPath) {
    return rootParentId;
  }

  // Procurar página pai
  const parentPage = allPages.find(p => p.filePath === page.parentPath + '.md');

  if (parentPage && pageMapping[parentPage.filePath]) {
    return pageMapping[parentPage.filePath];
  }

  // Fallback: parent da importação
  return rootParentId;
}

/**
 * Resolve links internos [[Page Name]]
 */
async function resolveInternalLinks(
  pages: NotionPage[],
  pageMapping: Record<string, string>
): Promise<void> {
  const supabase = await createServerClient() as any;

  for (const page of pages) {
    const pageId = pageMapping[page.filePath];
    if (!pageId) continue;

    // Extrair links
    const links = page.links;
    if (links.length === 0) continue;

    // Criar entradas na tabela page_links
    for (const link of links) {
      // Tentar encontrar página alvo pelo título
      const targetPage = pages.find(p => p.title === link.text);

      if (targetPage && pageMapping[targetPage.filePath]) {
        const targetPageId = pageMapping[targetPage.filePath];

        await supabase.from('page_links').insert({
          source_page_id: pageId,
          target_page_id: targetPageId,
          link_type: 'mention',
        }).select();
      }
    }
  }
}

// =====================================================
// PROGRESS TRACKING (para UI futura)
// =====================================================

/**
 * Obtém progresso de uma importação
 * (Por enquanto retorna apenas status final, pode ser expandido para tracking real-time)
 */
export async function getImportProgress(jobId: string): Promise<{
  status: 'completed' | 'failed' | 'processing';
  progress: number;
  message: string;
}> {
  // TODO: Implementar tracking real-time quando necessário
  return {
    status: 'completed',
    progress: 100,
    message: 'Importação concluída',
  };
}
