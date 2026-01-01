'use client';

/**
 * Seletor de capa (cover) para páginas
 */

import { useState, useRef } from 'react';
import { Image, Upload, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PageCoverPickerProps {
  /** URL da capa atual */
  currentCover?: string | null;
  /** ID da página (para upload) */
  pageId: string;
  /** Callback quando uma capa é selecionada */
  onCoverSelect: (coverUrl: string | null) => void;
}

// Capas padrão do Unsplash (imagens gratuitas)
const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200',
  'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200',
  'https://images.unsplash.com/photo-1511884642898-4c92249e20b6?w=1200',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200',
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200',
  'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1200',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200',
];

export function PageCoverPicker({
  currentCover,
  pageId,
  onCoverSelect,
}: PageCoverPickerProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePresetSelect = (coverUrl: string) => {
    onCoverSelect(coverUrl);
    setOpen(false);
  };

  const handleRemoveCover = () => {
    onCoverSelect(null);
    setOpen(false);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    try {
      setIsUploading(true);

      // Upload via API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pageId', pageId);
      formData.append('type', 'cover');

      const response = await fetch('/api/upload/cover', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao fazer upload da imagem');
      }

      const { url } = await response.json();

      onCoverSelect(url);
      setOpen(false);
      toast.success('Capa atualizada com sucesso');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error('Erro ao fazer upload da capa');
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <Image className="w-4 h-4" />
            {currentCover ? 'Alterar capa' : 'Adicionar capa'}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-96 p-0" align="start">
          <div className="flex flex-col max-h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="font-semibold text-sm">Selecionar capa</h4>
              {currentCover && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCover}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remover
                </Button>
              )}
            </div>

            {/* Upload button */}
            <div className="border-b p-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Fazendo upload...' : 'Upload de imagem'}
              </Button>
            </div>

            {/* Preset covers */}
            <div className="overflow-y-auto p-4">
              <p className="text-xs text-muted-foreground mb-3">
                Capas sugeridas
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_COVERS.map((coverUrl, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetSelect(coverUrl)}
                    className="relative aspect-video rounded-md overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                  >
                    <img
                      src={coverUrl}
                      alt={`Cover ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
}
