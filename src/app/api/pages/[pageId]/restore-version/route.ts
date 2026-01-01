/**
 * API Route para restaurar uma versão de página
 * POST /api/pages/[pageId]/restore-version
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const body = await request.json();
    const { versionId, workspaceId } = body;

    if (!versionId || !workspaceId) {
      return NextResponse.json(
        { error: 'versionId e workspaceId são obrigatórios' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient() as any;

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se usuário tem acesso à página
    const { data: page } = await supabase
      .from('pages')
      .select('workspace_id, content_json, content_text')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 });
    }

    // Buscar versão a restaurar
    const { data: version, error: versionError } = await supabase
      .from('page_versions')
      .select('*')
      .eq('id', versionId)
      .eq('page_id', pageId)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        { error: 'Versão não encontrada' },
        { status: 404 }
      );
    }

    // Criar versão da página atual antes de restaurar
    // @ts-ignore - page_versions table exists but types not yet regenerated
    await supabase.from('page_versions').insert({
      page_id: pageId,
      content_json: (page as any).content_json,
      content_text: (page as any).content_text,
      created_by: user.id,
      change_summary: 'Antes de restaurar versão anterior',
    });

    // Restaurar conteúdo da versão
    const { error: updateError } = await supabase
      .from('pages')
      .update({
        content_json: (version as any).content_json,
        content_text: (version as any).content_text,
      })
      .eq('id', pageId);

    if (updateError) {
      console.error('Error restoring version:', updateError);
      return NextResponse.json(
        { error: 'Erro ao restaurar versão' },
        { status: 500 }
      );
    }

    // Revalidar cache
    revalidatePath(`/${workspaceId}/pages/${pageId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in restore-version API route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
