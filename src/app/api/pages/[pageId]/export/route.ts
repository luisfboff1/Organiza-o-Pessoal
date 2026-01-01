/**
 * API Route para exportar páginas
 * GET /api/pages/[pageId]/export?format=markdown|pdf&includeChildren=true|false
 */

import { NextRequest, NextResponse } from 'next/server';
import { exportPage, type ExportFormat } from '@/features/pages/actions/export-page';

export const maxDuration = 300; // 5 minutos para exportações grandes

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parâmetros da query
    const format = (searchParams.get('format') || 'markdown') as ExportFormat;
    const includeChildren = searchParams.get('includeChildren') === 'true';

    // Validar formato
    if (!['markdown', 'pdf'].includes(format)) {
      return NextResponse.json(
        { error: 'Formato inválido. Use "markdown" ou "pdf"' },
        { status: 400 }
      );
    }

    // Validar pageId
    if (!pageId) {
      return NextResponse.json(
        { error: 'ID da página não fornecido' },
        { status: 400 }
      );
    }

    // Exportar página
    const result = await exportPage({
      pageId,
      format,
      includeChildren,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Erro ao exportar página' },
        { status: 500 }
      );
    }

    const { content, filename, mimeType } = result.data;

    // Preparar resposta baseada no formato
    if (format === 'markdown') {
      // Retornar Markdown como texto
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (format === 'pdf') {
      // Retornar PDF (base64 decodificado)
      const buffer = Buffer.from(content, 'base64');

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    return NextResponse.json(
      { error: 'Formato de exportação não suportado' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in export API route:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
