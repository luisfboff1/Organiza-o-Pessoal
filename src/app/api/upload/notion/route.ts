/**
 * API Route para upload de arquivo ZIP do Notion
 *
 * POST /api/upload/notion
 */

import { NextRequest, NextResponse } from 'next/server';
import { importNotionZip } from '@/features/pages/actions/import-notion';

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceId = formData.get('workspaceId') as string | null;
    const parentId = formData.get('parentId') as string | null;

    // 2. Validar campos obrigatórios
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Arquivo não fornecido' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId não fornecido' },
        { status: 400 }
      );
    }

    // 3. Validar tipo de arquivo
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { success: false, error: 'Arquivo deve ser um ZIP' },
        { status: 400 }
      );
    }

    // 4. Validar tamanho (máximo 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Arquivo muito grande. Máximo: ${maxSize / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    console.log(`📤 Recebendo upload do Notion: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    // 5. Processar importação
    const result = await importNotionZip({
      workspaceId,
      zipFile: file,
      parentId: parentId || null,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      message: 'Importação iniciada com sucesso',
    });

  } catch (error) {
    console.error('❌ Erro no upload:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// Configuração do route
export const runtime = 'nodejs'; // Necessário para processar arquivos grandes
export const maxDuration = 300; // 5 minutos timeout
