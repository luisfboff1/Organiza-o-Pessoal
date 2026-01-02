'use client';

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useRef, useMemo } from 'react';
import { HyperFormula } from 'hyperformula';

// Registrar todos os módulos do Handsontable
registerAllModules();

interface SpreadsheetBlockProps {
  data?: any[][];
  onChange?: (data: any[][]) => void;
  readOnly?: boolean;
}

export function SpreadsheetBlock({ data, onChange, readOnly = false }: SpreadsheetBlockProps) {
  const hotTableRef = useRef<any>(null);

  // Dados padrão se nenhum for fornecido
  const defaultData = [
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
    ['', '', '', ''],
  ];

  // Configurar HyperFormula engine com opções otimizadas
  const hyperformulaInstance = useMemo(() => {
    return HyperFormula.buildEmpty({
      licenseKey: 'internal-use-in-handsontable',
      // Configurações para português brasileiro
      localeLang: 'pt-BR',
      // Permitir células vazias em fórmulas
      useArrayArithmetic: true,
      // Precisão de cálculo
      precisionRounding: 10,
      // Funções extras
      useColumnIndex: true,
      // Otimizações
      smartRounding: true,
    });
  }, []);

  const handleAfterChange = (_changes: any, source: string) => {
    if (source === 'loadData') return;

    if (hotTableRef.current && onChange) {
      const hot = (hotTableRef.current as any).hotInstance;
      if (hot) {
        const currentData = hot.getData();
        onChange(currentData);
      }
    }
  };

  return (
    <div className="spreadsheet-container border rounded-lg overflow-hidden my-4">
      <HotTable
        ref={hotTableRef}
        data={data || defaultData}
        rowHeaders={true}
        colHeaders={true}
        height="auto"
        width="100%"
        minRows={5}
        minCols={5}
        licenseKey="non-commercial-and-evaluation"
        readOnly={readOnly}
        afterChange={handleAfterChange}
        // Habilitar fórmulas com HyperFormula
        formulas={{
          engine: hyperformulaInstance,
        }}
        // Permitir copiar/colar
        copyPaste={true}
        // Permitir undo/redo
        undo={true}
        // Permitir arrastar para preencher
        fillHandle={true}
        // Permitir redimensionar colunas/linhas
        manualColumnResize={true}
        manualRowResize={true}
        // Permitir mover colunas/linhas
        manualColumnMove={true}
        manualRowMove={true}
        // Habilitar menu de contexto completo
        dropdownMenu={true}
        // Filtros
        filters={true}
        // Auto column size
        autoColumnSize={true}
        // Permitir adicionar/remover linhas e colunas
        contextMenu={{
          items: {
            row_above: {},
            row_below: {},
            col_left: {},
            col_right: {},
            remove_row: {},
            remove_col: {},
            undo: {},
            redo: {},
            make_read_only: {},
            alignment: {},
            cut: {},
            copy: {},
            freeze_column: {},
            unfreeze_column: {},
            borders: {},
            commentsAddEdit: {},
            commentsRemove: {},
            commentsReadOnly: {},
          },
        }}
        // Estilo para dark mode
        className="htDark"
      />

      {/* Legenda de uso */}
      <div className="p-2 bg-muted text-xs text-muted-foreground border-t">
        💡 <strong>Dica:</strong> Use fórmulas como no Excel (ex: =SOMA(A1:A5), =A1*2, =SE(A1&gt;10;&quot;Sim&quot;;&quot;Não&quot;))
      </div>
    </div>
  );
}
