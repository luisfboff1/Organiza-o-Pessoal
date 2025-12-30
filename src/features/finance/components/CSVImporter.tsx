'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CSVImporterProps {
  workspaceId: string;
  onImportComplete: () => void;
}

export function CSVImporter({ workspaceId, onImportComplete }: CSVImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseBRCurrency = (value: string): number => {
    // Remove "R$", espaços, e converte vírgula para ponto
    const cleaned = value
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '') // Remove separador de milhares
      .replace(',', '.') // Converte vírgula decimal para ponto
      .trim();

    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  };

  const parseBRDate = (dateStr: string): string => {
    // Converte DD/MM/YYYY para YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  const getTypeFromPortuguese = (tipo: string): string => {
    switch (tipo.toLowerCase()) {
      case 'receita':
        return 'income';
      case 'despesa':
        return 'expense';
      case 'investimento':
        return 'investment';
      case 'saldo':
        return 'balance';
      default:
        return 'expense';
    }
  };

  const getStatusFromPortuguese = (status: string): string => {
    return status.toLowerCase() === 'pago' ? 'paid' : 'pending';
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());

      // Pula a primeira linha (cabeçalho)
      const dataLines = lines.slice(1);

      const entries = dataLines.map(line => {
        const columns = parseCSVLine(line);

        // Formato esperado: Data,Descrição,Tipo,Categoria,Valor,Saldo Atual,Status Pagamentos,Valor Real,Empresas,Projeto
        return {
          date: parseBRDate(columns[0] || ''),
          description: columns[1] || '',
          type: getTypeFromPortuguese(columns[2] || 'Despesa'),
          category: columns[3] || 'Outros',
          amount: parseBRCurrency(columns[4] || '0'),
          status: getStatusFromPortuguese(columns[6] || 'Pago'),
          company: columns[8] || '',
          note: columns[9] || '',
        };
      }).filter(entry => entry.amount > 0 && entry.date); // Remove entradas inválidas

      // Enviar para o servidor
      const response = await fetch('/api/finance/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          entries,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao importar dados');
      }

      toast({
        title: 'Importação concluída!',
        description: `${entries.length} lançamentos foram importados com sucesso.`,
      });

      onImportComplete();
    } catch (error) {
      console.error('Erro ao importar CSV:', error);
      toast({
        title: 'Erro na importação',
        description: 'Ocorreu um erro ao importar o arquivo CSV.',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      // Resetar o input
      event.target.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
        disabled={isImporting}
      />
      <label htmlFor="csv-upload">
        <Button
          type="button"
          variant="outline"
          disabled={isImporting}
          asChild
        >
          <span className="cursor-pointer">
            {isImporting ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importar CSV
              </>
            )}
          </span>
        </Button>
      </label>
    </div>
  );
}
