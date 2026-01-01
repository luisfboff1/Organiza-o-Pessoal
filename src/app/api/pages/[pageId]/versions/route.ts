/**
 * API Route para listar versões de uma página
 * GET /api/pages/[pageId]/versions?workspaceId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId é obrigatório' },
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
      .select('workspace_id')
      .eq('id', pageId)
      .eq('workspace_id', workspaceId)
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 });
    }

    // Buscar versões
    // @ts-ignore - page_versions table exists but types not yet regenerated
    const { data: versions, error } = await supabase
      .from('page_versions')
      .select('*')
      .eq('page_id', pageId)
      .order('created_at', { ascending: false })
      .limit(50); // Últimas 50 versões

    if (error) {
      console.error('Error fetching versions:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar versões' },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions: versions || [] });
  } catch (error) {
    console.error('Error in versions API route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
