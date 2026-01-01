/**
 * API Route para upload de capas de páginas
 * POST /api/upload/cover
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const maxFileSize = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pageId = formData.get('pageId') as string;
    const type = formData.get('type') as string; // 'cover' ou 'asset'

    // Validações
    if (!file) {
      return NextResponse.json({ error: 'Arquivo não fornecido' }, { status: 400 });
    }

    if (!pageId) {
      return NextResponse.json({ error: 'ID da página não fornecido' }, { status: 400 });
    }

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 5MB' },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Tipo de arquivo inválido. Apenas imagens são permitidas.' },
        { status: 400 }
      );
    }

    // Autenticar
    const supabase = await createServerClient() as any;
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
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Página não encontrada' }, { status: 404 });
    }

    // Upload para Supabase Storage
    const bucket = type === 'cover' ? 'page-covers' : 'page-assets';
    const fileExt = file.name.split('.').pop();
    const fileName = `${pageId}_${Date.now()}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const fileBuffer = await file.arrayBuffer();

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Erro ao fazer upload do arquivo' },
        { status: 500 }
      );
    }

    // Obter URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    // Se for capa, atualizar a página
    if (type === 'cover') {
      const { error: updateError } = await supabase
        .from('pages')
        .update({ cover: publicUrl })
        .eq('id', pageId);

      if (updateError) {
        console.error('Error updating page cover:', updateError);
        // Não falhar a requisição, URL foi gerada
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Error in cover upload route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
