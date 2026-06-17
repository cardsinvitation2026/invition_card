'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminFormActions } from '@/components/admin/AdminFormActions';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import {
  CreateFieldSchema,
  fieldTypeSchema,
  type CreateFieldInput,
} from '@/validations/template-field.validation';
import { AdminApiError } from '@/lib/admin/api';
import { z } from 'zod';

const FIELD_TYPES = fieldTypeSchema.options;

const FieldFormSchema = CreateFieldSchema.extend({
  validationRulesJson: z.string().optional(),
});

type FieldFormValues = z.infer<typeof FieldFormSchema>;

export function TemplateFieldForm({
  defaultValues,
  submitLabel,
  cancelHref,
  showTemplateId = true,
  templateId,
  onCancel,
  onSubmit,
}: {
  defaultValues?: Partial<CreateFieldInput>;
  submitLabel?: string;
  cancelHref: string;
  showTemplateId?: boolean;
  templateId?: string;
  onCancel?: () => void;
  onSubmit: (values: CreateFieldInput) => Promise<void>;
}) {
  const form = useForm<FieldFormValues>({
    resolver: zodResolver(FieldFormSchema) as Resolver<FieldFormValues>,
    defaultValues: {
      templateId: templateId ?? '',
      fieldKey: '',
      fieldLabel: '',
      fieldType: 'text',
      placeholder: '',
      required: false,
      sortOrder: 0,
      validationRules: null,
      validationRulesJson: defaultValues?.validationRules
        ? JSON.stringify(defaultValues.validationRules, null, 2)
        : '',
      ...defaultValues,
    },
  });

  async function handleSubmit(values: FieldFormValues) {
    let validationRules: CreateFieldInput['validationRules'] = values.validationRules ?? null;
    if (values.validationRulesJson?.trim()) {
      try {
        validationRules = JSON.parse(values.validationRulesJson) as NonNullable<CreateFieldInput['validationRules']>;
      } catch {
        form.setError('validationRulesJson', { message: 'Invalid JSON' });
        return;
      }
    }
    const payload: CreateFieldInput = {
      templateId: values.templateId,
      fieldKey: values.fieldKey,
      fieldLabel: values.fieldLabel,
      fieldType: values.fieldType,
      placeholder: values.placeholder || null,
      required: values.required,
      sortOrder: values.sortOrder,
      validationRules,
    };
    try {
      await onSubmit(payload);
      toast.success('Field saved');
    } catch (e) {
      if (e instanceof AdminApiError && e.errors) {
        Object.entries(e.errors).forEach(([key, msgs]) => {
          form.setError(key as keyof FieldFormValues, { message: msgs[0] });
        });
      }
      toast.error(e instanceof Error ? e.message : 'Failed to save field');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <AdminSectionCard title="Field definition">
          <div className="grid gap-4 md:grid-cols-2">
            {showTemplateId && (
              <FormField
                control={form.control}
                name="templateId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Template ID</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly={Boolean(templateId)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="fieldKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Key</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="BRIDE_NAME" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fieldLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Label</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fieldType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Field Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="placeholder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placeholder</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="required"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="required" />
                  </FormControl>
                  <FormLabel htmlFor="required">Required</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validationRulesJson"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Validation Rules JSON</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder='{"maxLength": 100}'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminSectionCard>
        <AdminFormActions
          submitLabel={submitLabel}
          cancelHref={onCancel ? undefined : cancelHref}
          onCancel={onCancel}
          loading={form.formState.isSubmitting}
        />
      </form>
    </Form>
  );
}
