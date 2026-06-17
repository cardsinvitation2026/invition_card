'use client';

import type { Control, FieldValues } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RuntimeFieldRenderer } from '@/components/runtime-form/RuntimeFieldRenderer';
import type { RuntimeSection } from '@/types/form-runtime';

export function RuntimeSectionBlock<T extends FieldValues>({
  section,
  control,
}: {
  section: RuntimeSection;
  control: Control<T>;
}) {
  if (section.fields.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30 py-4">
        <CardTitle className="text-lg">{section.label}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
        {section.fields.map((field) => (
          <div
            key={field.id}
            className={field.fieldType === 'textarea' ? 'sm:col-span-2' : undefined}
          >
            <RuntimeFieldRenderer field={field} control={control} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
