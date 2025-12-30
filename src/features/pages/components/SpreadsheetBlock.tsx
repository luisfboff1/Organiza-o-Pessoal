'use client';

import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import { useEffect, useRef } from 'react';
import Handsontable from 'handsontable';
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

  const handleAfterChange = (changes: any, source: string) => {
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
        licenseKey="non-commercial-and-evaluation"
        readOnly={readOnly}
        afterChange={handleAfterChange}
        contextMenu={true}
        formulas={{
          engine: HyperFormula,
        }}
        // Estilo para dark mode
        className="htDark"
      />
    </div>
  );
}
