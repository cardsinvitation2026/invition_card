'use client';

import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { RuntimeField } from '@/types/form-runtime';

export function RuntimeFieldRenderer<T extends FieldValues>({
  field,
  control,
}: {
  field: RuntimeField;
  control: Control<T>;
}) {
  const name = field.key as FieldPath<T>;

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: formField }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </FormLabel>
          <FormControl>{renderControl(field, formField)}</FormControl>
          {field.placeholder ? (
            <FormDescription className="text-xs">{field.placeholder}</FormDescription>
          ) : null}
          {field.helpText && !field.helpText.startsWith('{') ? (
            <FormDescription className="text-xs">{field.helpText}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function renderControl(
  field: RuntimeField,
  formField: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    name: string;
    ref: (instance: HTMLInputElement | HTMLTextAreaElement | null) => void;
  },
) {
  const stringValue =
    formField.value === undefined || formField.value === null
      ? ''
      : String(formField.value);

  switch (field.fieldType) {
    case 'textarea':
      return (
        <Textarea
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          value={stringValue}
          placeholder={field.placeholder ?? undefined}
          rows={4}
          onChange={(e) => formField.onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <Input
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          type="number"
          value={stringValue}
          placeholder={field.placeholder ?? undefined}
          onChange={(e) => {
            const v = e.target.value;
            formField.onChange(v === '' ? undefined : Number(v));
          }}
        />
      );
    case 'date':
      return (
        <Input
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          type="date"
          value={stringValue}
          onChange={(e) => formField.onChange(e.target.value)}
        />
      );
    case 'email':
      return (
        <Input
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          type="email"
          value={stringValue}
          placeholder={field.placeholder ?? undefined}
          onChange={(e) => formField.onChange(e.target.value)}
        />
      );
    case 'phone':
      return (
        <Input
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          type="tel"
          value={stringValue}
          placeholder={field.placeholder ?? undefined}
          onChange={(e) => formField.onChange(e.target.value)}
        />
      );
    case 'url':
    case 'image':
      return (
        <Input
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          type="url"
          value={stringValue}
          placeholder={field.placeholder ?? undefined}
          onChange={(e) => formField.onChange(e.target.value)}
        />
      );
    case 'text':
    default:
      return (
        <Input
          name={formField.name}
          ref={formField.ref}
          onBlur={formField.onBlur}
          type="text"
          value={stringValue}
          placeholder={field.placeholder ?? undefined}
          onChange={(e) => formField.onChange(e.target.value)}
        />
      );
  }
}
