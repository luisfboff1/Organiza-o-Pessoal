'use client';

import { Input } from '@/components/ui/input';
import { PageIconPicker } from './PageIconPicker';

interface PageTitleProps {
  defaultValue: string;
  icon?: string | null;
  pageId: string;
  onUpdate: (formData: FormData) => void;
  onIconUpdate?: (icon: string | null) => void;
}

export function PageTitle({
  defaultValue,
  icon,
  pageId,
  onUpdate,
  onIconUpdate,
}: PageTitleProps) {
  return (
    <div className="flex items-start gap-2">
      {/* Icon Picker */}
      {onIconUpdate && (
        <PageIconPicker
          currentIcon={icon}
          onIconSelect={onIconUpdate}
          size="lg"
        />
      )}

      {/* Title Input */}
      <form action={onUpdate} className="flex-1">
        <Input
          name="title"
          defaultValue={defaultValue}
          className="text-4xl font-bold border-none px-0 focus-visible:ring-0"
          placeholder="Título da página"
          onBlur={(e) => {
            e.currentTarget.form?.requestSubmit();
          }}
        />
      </form>
    </div>
  );
}
