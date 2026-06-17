'use client';

import { useEffect, useMemo } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { RuntimeSectionBlock } from '@/components/runtime-form/RuntimeSection';
import {
  buildDefaultFormValues,
  buildFormZodSchema,
} from '@/features/runtime-form/field-validator';
import { buildPreviewData } from '@/features/runtime-form/preview-data.builder';
import type {
  PreviewDataObject,
  RuntimeFormDefinition,
  RuntimeFormValues,
} from '@/types/form-runtime';

export function RuntimeForm({
  definition,
  restoredValues,
  onValuesChange,
  onPreviewGenerated,
  onSaveDraft,
}: {
  definition: RuntimeFormDefinition;
  restoredValues?: RuntimeFormValues;
  onValuesChange?: (values: RuntimeFormValues) => void;
  onPreviewGenerated: (data: PreviewDataObject) => void;
  onSaveDraft?: () => Promise<void>;
}) {
  const schema = useMemo(() => buildFormZodSchema(definition), [definition]);
  const defaultValues = useMemo(() => buildDefaultFormValues(definition), [definition]);

  const form = useForm<RuntimeFormValues>({
    resolver: zodResolver(schema) as Resolver<RuntimeFormValues>,
    defaultValues,
  });

  useEffect(() => {
    if (restoredValues) {
      form.reset(restoredValues);
    }
  }, [restoredValues, form]);

  useEffect(() => {
    if (!onValuesChange) {
      return;
    }
    const subscription = form.watch((values) => {
      onValuesChange(values as RuntimeFormValues);
    });
    return () => subscription.unsubscribe();
  }, [form, onValuesChange]);

  function handleSubmit(values: RuntimeFormValues) {
    const preview = buildPreviewData(values, definition.fields);
    onPreviewGenerated(preview);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {definition.sections.map((section) => (
          <RuntimeSectionBlock key={section.key} section={section} control={form.control} />
        ))}
        <div className="sticky bottom-0 z-10 -mx-1 flex flex-col gap-2 border-t bg-background/95 px-1 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row">
          {onSaveDraft ? (
            <Button
              type="button"
              size="lg"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={form.formState.isSubmitting}
              onClick={() => void onSaveDraft()}
            >
              Save draft
            </Button>
          ) : null}
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={form.formState.isSubmitting}
          >
            Generate preview data
          </Button>
        </div>
      </form>
    </Form>
  );
}
