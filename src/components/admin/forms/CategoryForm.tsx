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
import { AdminFormActions } from '@/components/admin/AdminFormActions';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { CategoryCreateSchema, type CategoryCreateInput } from '@/validations/category.validation';
import { AdminApiError } from '@/lib/admin/api';

type CategoryFormValues = CategoryCreateInput;

export function CategoryForm({
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  defaultValues?: Partial<CategoryFormValues>;
  submitLabel?: string;
  cancelHref: string;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryCreateSchema) as Resolver<CategoryFormValues>,
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      sortOrder: 0,
      isActive: true,
      thumbnail: null,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      ...defaultValues,
    },
  });

  async function handleSubmit(values: CategoryFormValues) {
    try {
      await onSubmit({
        ...values,
        description: values.description || null,
        thumbnail: values.thumbnail || null,
        seoTitle: values.seoTitle || null,
        seoDescription: values.seoDescription || null,
        seoKeywords: values.seoKeywords || null,
      });
      toast.success('Category saved');
    } catch (e) {
      if (e instanceof AdminApiError && e.errors) {
        Object.entries(e.errors).forEach(([key, msgs]) => {
          form.setError(key as keyof CategoryFormValues, { message: msgs[0] });
        });
      }
      toast.error(e instanceof Error ? e.message : 'Failed to save category');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <AdminSectionCard title="Basic details">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnail"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Thumbnail URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminSectionCard>
        <AdminSectionCard title="SEO & settings">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="seoTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Title</FormLabel>
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
              name="seoDescription"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>SEO Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0 md:col-span-2">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="isActive" />
                  </FormControl>
                  <FormLabel htmlFor="isActive">Active</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminSectionCard>
        <AdminFormActions
          submitLabel={submitLabel}
          cancelHref={cancelHref}
          loading={form.formState.isSubmitting}
        />
      </form>
    </Form>
  );
}
