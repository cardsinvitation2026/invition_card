'use client';

import { useEffect, useState } from 'react';
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
import { LocalFilePreview } from '@/components/admin/LocalFilePreview';
import {
  TemplateCreateSchema,
  type TemplateCreateInput,
} from '@/validations/template.validation';
import { adminFetch, AdminApiError } from '@/lib/admin/api';
import type { CategoryWithCount } from '@/types/category';

type TemplateFormValues = TemplateCreateInput;

export function TemplateForm({
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  defaultValues?: Partial<TemplateFormValues>;
  submitLabel?: string;
  cancelHref: string;
  onSubmit: (values: TemplateFormValues) => Promise<void>;
}) {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(TemplateCreateSchema) as Resolver<TemplateFormValues>,
    defaultValues: {
      title: '',
      slug: '',
      description: null,
      categoryId: '',
      thumbnailUrl: null,
      previewVideoUrl: null,
      language: 'EN',
      templateType: 'VIDEO',
      visibility: 'PUBLIC',
      status: 'DRAFT',
      isFeatured: false,
      metaTitle: null,
      metaDescription: null,
      keywords: null,
      musicId: null,
      trending: false,
      bestSeller: false,
      ...defaultValues,
    },
  });

  useEffect(() => {
    adminFetch<{ items: CategoryWithCount[]; total: number }>('/api/admin/categories')
      .then((res) => setCategories(res.data?.items ?? []))
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  async function handleSubmit(values: TemplateFormValues) {
    try {
      await onSubmit({
        ...values,
        description: values.description || null,
        thumbnailUrl: values.thumbnailUrl || null,
        previewVideoUrl: values.previewVideoUrl || null,
        metaTitle: values.metaTitle || null,
        metaDescription: values.metaDescription || null,
        keywords: values.keywords || null,
        musicId: values.musicId || null,
      });
      toast.success('Template saved');
    } catch (e) {
      if (e instanceof AdminApiError && e.errors) {
        Object.entries(e.errors).forEach(([key, msgs]) => {
          form.setError(key as keyof TemplateFormValues, { message: msgs[0] });
        });
      }
      toast.error(e instanceof Error ? e.message : 'Failed to save template');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <AdminSectionCard title="Basic details">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
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
                    <Textarea {...field} value={field.value ?? ''} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EN">English</SelectItem>
                      <SelectItem value="HI">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="templateType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Type</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VIDEO">Video</SelectItem>
                      <SelectItem value="PDF_SINGLE">PDF Single</SelectItem>
                      <SelectItem value="PDF_MULTI">PDF Multi</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="PUBLISHED">Published</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="Media">
          <div className="grid gap-4 md:grid-cols-2">
            <LocalFilePreview kind="image" label="Thumbnail upload (preview only)" />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LocalFilePreview kind="video" label="Preview video upload (preview only)" />
            <FormField
              control={form.control}
              name="previewVideoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preview Video URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </AdminSectionCard>

        <AdminSectionCard title="SEO & flags">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metaDescription"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(['isFeatured', 'trending', 'bestSeller'] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id={name}
                      />
                    </FormControl>
                    <FormLabel htmlFor={name} className="capitalize">
                      {name === 'isFeatured' ? 'Featured' : name === 'bestSeller' ? 'Best Seller' : 'Trending'}
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
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
