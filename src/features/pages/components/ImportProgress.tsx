'use client';

/**
 * Componente de progresso da importação
 */

import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ImportProgressProps {
  status?: 'idle' | 'uploading' | 'parsing' | 'importing' | 'completed' | 'error';
  progress?: number;
  currentStep?: string;
  totalPages?: number;
  processedPages?: number;
}

export function ImportProgress({
  status = 'importing',
  progress = 50,
  currentStep = 'Processando páginas...',
  totalPages = 0,
  processedPages = 0,
}: ImportProgressProps) {
  const isCompleted = status === 'completed';
  const isError = status === 'error';

  return (
    <div className="space-y-4 py-4">
      {/* Status Icon */}
      <div className="flex items-center justify-center">
        {isCompleted ? (
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        ) : isError ? (
          <AlertCircle className="w-12 h-12 text-destructive" />
        ) : (
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        )}
      </div>

      {/* Progress Bar */}
      {!isCompleted && !isError && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{currentStep}</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {totalPages > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {isCompleted ? (
            <p>
              <strong className="text-foreground">{processedPages}</strong> páginas
              importadas com sucesso
            </p>
          ) : (
            <p>
              Processando{' '}
              <strong className="text-foreground">
                {processedPages} / {totalPages}
              </strong>{' '}
              páginas
            </p>
          )}
        </div>
      )}

      {/* Status Message */}
      <p className="text-center text-sm">
        {isCompleted && 'Importação concluída!'}
        {isError && 'Erro durante a importação'}
        {!isCompleted && !isError && 'Por favor, aguarde...'}
      </p>
    </div>
  );
}
