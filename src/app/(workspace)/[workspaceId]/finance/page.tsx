'use client';

import { use, useState } from 'react';
import { useFinanceTable } from '@/features/finance/hooks/useFinanceTable';
import { FinanceTableAdvanced } from '@/features/finance/components/FinanceTableAdvanced';
import { FinanceSummary } from '@/features/finance/components/FinanceSummary';
import { FinanceFilters } from '@/features/finance/components/FinanceFilters';
import { CSVImporter } from '@/features/finance/components/CSVImporter';
import { CashFlowChartDaily } from '@/features/finance/components/CashFlowChartDaily';
import { CustomChartBuilder } from '@/features/finance/components/CustomChartBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function FinancePage({ params }: { params: Promise<{ workspaceId: string }> }) {
  const { workspaceId } = use(params);

  // Filtros: último mês por padrão
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const [startDate, setStartDate] = useState(lastMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('all');

  // Buscar entradas filtradas para a tabela
  const { entries, summary, isLoading, createEntry, updateEntry, deleteEntry } = useFinanceTable({
    workspaceId,
    startDate,
    endDate,
    type: typeFilter === 'all' ? undefined : (typeFilter as any),
  });

  // Buscar TODAS as entradas para os gráficos (sem filtro de data)
  const { entries: allEntries } = useFinanceTable({
    workspaceId,
    type: typeFilter === 'all' ? undefined : (typeFilter as any),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">Carregando lançamentos...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-3 md:p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">Financeiro</h1>
        <CSVImporter
          workspaceId={workspaceId}
          onImportComplete={() => {
            // Refresh will happen automatically via useFinanceTable
            window.location.reload();
          }}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        <FinanceSummary
          workspaceId={workspaceId}
          summary={summary}
          entries={allEntries}
          startDate={startDate}
          endDate={endDate}
        />

        <Tabs defaultValue="table" className="mt-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4 mt-4">
            <FinanceFilters
              startDate={startDate}
              endDate={endDate}
              type={typeFilter}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onTypeChange={setTypeFilter}
            />

            <FinanceTableAdvanced
              entries={entries}
              workspaceId={workspaceId}
              onUpdateEntry={updateEntry}
              onDeleteEntry={(entryId) => deleteEntry({ entryId, workspaceId })}
              onCreateEntry={createEntry}
            />
          </TabsContent>

          <TabsContent value="cashflow" className="mt-4">
            <CashFlowChartDaily entries={entries} allEntries={allEntries} />
          </TabsContent>

          <TabsContent value="charts" className="mt-4">
            <CustomChartBuilder entries={allEntries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
