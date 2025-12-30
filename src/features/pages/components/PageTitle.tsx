'use client';

import { Input } from '@/components/ui/input';

interface PageTitleProps {
  defaultValue: string;
  onUpdate: (formData: FormData) => void;
}

export function PageTitle({ defaultValue, onUpdate }: PageTitleProps) {
  return (
    <form action={onUpdate}>
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
  );
}
