'use client';

import { use, useState } from 'react';
import { useFinanceTable } from '@/features/finance/hooks/useFinanceTable';
import { FinanceTableAdvanced } from '@/features/finance/components/FinanceTableAdvanced';
import { FinanceSummary } from '@/features/finance/components/FinanceSummary';
import { FinanceFilters } from '@/features/finance/components/FinanceFilters';
import { CSVImporter } from '@/features/finance/components/CSVImporter';
import { CashFlowChartDaily } from '@/features/finance/components/CashFlowChartDaily';
import { CustomChartBuilder } from '@/features/finance/components/CustomChartBuilder';
import { RecurringRulesTab } from '@/features/finance/components/RecurringRulesTab';
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

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-3 md:p-4 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">Financeiro</h1>
        <CSVImporter
          workspaceId={workspaceId}
          onImportComplete={() => {
            // Refresh will happen automatically via useFinanceTable/React Query
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

        <Tabs defaultValue="cashflow" className="mt-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="recurring">Recorrentes</TabsTrigger>
            <TabsTrigger value="charts">Gráficos</TabsTrigger>
          </TabsList>

          <TabsContent value="cashflow" className="mt-4 space-y-6">
            <CashFlowChartDaily entries={entries} allEntries={allEntries} />

            {/* Próximas Contas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Próximas Contas a Pagar */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-red-600 dark:text-red-400">Próximas Contas a Pagar</h3>
                <div className="space-y-2">
                  {allEntries
                    .filter(entry =>
                      entry.type === 'expense' &&
                      entry.status === 'pending' &&
                      new Date(entry.date) >= new Date()
                    )
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map(entry => (
                      <div key={entry.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{entry.description || entry.company}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="font-semibold text-red-600 dark:text-red-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                        </p>
                      </div>
                    ))}
                  {allEntries.filter(entry =>
                    entry.type === 'expense' &&
                    entry.status === 'pending' &&
                    new Date(entry.date) >= new Date()
                  ).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma conta a pagar pendente
                    </p>
                  )}
                </div>
              </div>

              {/* Próximas Contas a Receber */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4 text-green-600 dark:text-green-400">Próximas Contas a Receber</h3>
                <div className="space-y-2">
                  {allEntries
                    .filter(entry =>
                      entry.type === 'income' &&
                      entry.status === 'pending' &&
                      new Date(entry.date) >= new Date()
                    )
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map(entry => (
                      <div key={entry.id} className="flex justify-between items-center p-2 rounded hover:bg-muted/50">
                        <div>
                          <p className="font-medium text-sm">{entry.description || entry.company}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.amount)}
                        </p>
                      </div>
                    ))}
                  {allEntries.filter(entry =>
                    entry.type === 'income' &&
                    entry.status === 'pending' &&
                    new Date(entry.date) >= new Date()
                  ).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma conta a receber pendente
                    </p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

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

          <TabsContent value="recurring" className="mt-4">
            <RecurringRulesTab workspaceId={workspaceId} entries={allEntries} />
          </TabsContent>

          <TabsContent value="charts" className="mt-4">
            <CustomChartBuilder entries={allEntries} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
