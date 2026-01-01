'use client';

/**
 * Seletor de ícone (emoji) para páginas
 */

import { useState } from 'react';
import { Smile, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface PageIconPickerProps {
  /** Ícone atual */
  currentIcon?: string | null;
  /** Callback quando um ícone é selecionado */
  onIconSelect: (icon: string | null) => void;
  /** Tamanho do botão */
  size?: 'sm' | 'default' | 'lg';
}

// Lista de emojis comuns para páginas
const COMMON_EMOJIS = [
  // Documentos e arquivos
  '📄', '📝', '📋', '📊', '📈', '📉', '📁', '📂', '🗂️', '📑',
  // Trabalho e produtividade
  '💼', '📌', '📍', '🎯', '✅', '☑️', '✔️', '⭐', '🏆', '🎖️',
  // Ideias e criatividade
  '💡', '🧠', '🎨', '✨', '🌟', '💫', '🔥', '⚡', '🚀', '🎯',
  // Comunicação
  '💬', '💭', '🗨️', '📢', '📣', '🔔', '📧', '✉️', '📮', '📪',
  // Tempo e calendário
  '📅', '📆', '🗓️', '⏰', '⏱️', '⏲️', '🕐', '⌛', '⏳', '🔔',
  // Aprendizado
  '📚', '📖', '📕', '📗', '📘', '📙', '🎓', '🏫', '✏️', '📐',
  // Pessoas e equipe
  '👤', '👥', '👨', '👩', '👨‍💼', '👩‍💼', '🧑‍💻', '👨‍🏫', '👩‍🎓', '🤝',
  // Localização e mapas
  '🗺️', '🌍', '🌎', '🌏', '🏠', '🏢', '🏪', '🏬', '🏭', '🏗️',
  // Símbolos
  '⚙️', '🔧', '🔨', '🛠️', '⚡', '🔒', '🔓', '🔑', '🎁', '🏷️',
  // Natureza
  '🌱', '🌿', '🍀', '🌻', '🌺', '🌸', '🌼', '🌲', '🌳', '🌴',
  // Comida e bebida
  '☕', '🍵', '🥤', '🍰', '🎂', '🍕', '🍔', '🍎', '🍊', '🍇',
  // Transporte
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '✈️',
];

const EMOJI_CATEGORIES = [
  { name: 'Recentes', emojis: COMMON_EMOJIS.slice(0, 10) },
  { name: 'Documentos', emojis: COMMON_EMOJIS.slice(0, 10) },
  { name: 'Trabalho', emojis: COMMON_EMOJIS.slice(10, 20) },
  { name: 'Ideias', emojis: COMMON_EMOJIS.slice(20, 30) },
  { name: 'Comunicação', emojis: COMMON_EMOJIS.slice(30, 40) },
  { name: 'Tempo', emojis: COMMON_EMOJIS.slice(40, 50) },
  { name: 'Aprendizado', emojis: COMMON_EMOJIS.slice(50, 60) },
  { name: 'Pessoas', emojis: COMMON_EMOJIS.slice(60, 70) },
  { name: 'Locais', emojis: COMMON_EMOJIS.slice(70, 80) },
  { name: 'Símbolos', emojis: COMMON_EMOJIS.slice(80, 90) },
];

export function PageIconPicker({
  currentIcon,
  onIconSelect,
  size = 'default',
}: PageIconPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const handleIconSelect = (icon: string) => {
    onIconSelect(icon);
    setOpen(false);
  };

  const handleRemoveIcon = () => {
    onIconSelect(null);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className="hover:bg-muted"
        >
          {currentIcon ? (
            <span className="text-2xl">{currentIcon}</span>
          ) : (
            <Smile className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col h-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h4 className="font-semibold text-sm">Selecionar ícone</h4>
            {currentIcon && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveIcon}
              >
                <X className="w-4 h-4 mr-1" />
                Remover
              </Button>
            )}
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 border-b px-2 py-2 overflow-x-auto">
            {EMOJI_CATEGORIES.map((category, index) => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(index)}
                className={`px-3 py-1 text-xs rounded whitespace-nowrap transition-colors ${
                  activeCategory === index
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-8 gap-2">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleIconSelect(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-muted rounded transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* All emojis fallback */}
          {EMOJI_CATEGORIES[activeCategory].emojis.length === 0 && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-8 gap-2">
                {COMMON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleIconSelect(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-muted rounded transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
