import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { workspaceId, entries } = await request.json();

    if (!workspaceId || !entries || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Preparar os dados para inserção
    const formattedEntries = entries.map(entry => ({
      workspace_id: workspaceId,
      type: entry.type,
      category: entry.category,
      amount: entry.amount,
      date: entry.date,
      description: entry.description,
      note: entry.note,
      status: entry.status,
      company: entry.company,
    }));

    // Inserir em lote
    const { data, error } = await supabase
      .from('finance_entries')
      .insert(formattedEntries as any)
      .select();

    if (error) {
      console.error('Erro ao importar:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Recalcular todos os saldos
    await supabase.rpc('recalculate_all_balances' as any, {
      workspace_uuid: workspaceId,
    } as any);

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('Erro na importação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
