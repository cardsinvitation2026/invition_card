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
import { Checkbox } from '@/components/ui/checkbox';
import { AdminFormActions } from '@/components/admin/AdminFormActions';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import {
  CreateMusicSchema,
  type CreateMusicInput,
} from '@/validations/template-music.validation';
import { AdminApiError } from '@/lib/admin/api';

type MusicFormValues = CreateMusicInput;

export function TemplateMusicForm({
  defaultValues,
  submitLabel,
  cancelHref,
  onSubmit,
}: {
  defaultValues?: Partial<MusicFormValues>;
  submitLabel?: string;
  cancelHref: string;
  onSubmit: (values: MusicFormValues) => Promise<void>;
}) {
  const form = useForm<MusicFormValues>({
    resolver: zodResolver(CreateMusicSchema) as Resolver<MusicFormValues>,
    defaultValues: {
      title: '',
      audioUrl: '',
      durationSeconds: null,
      isDefault: false,
      artist: null,
      license: null,
      active: true,
      ...defaultValues,
    },
  });

  async function handleSubmit(values: MusicFormValues) {
    try {
      await onSubmit({
        ...values,
        durationSeconds: values.durationSeconds ?? null,
        artist: values.artist || null,
        license: values.license || null,
      });
      toast.success('Music track saved');
    } catch (e) {
      if (e instanceof AdminApiError && e.errors) {
        Object.entries(e.errors).forEach(([key, msgs]) => {
          form.setError(key as keyof MusicFormValues, { message: msgs[0] });
        });
      }
      toast.error(e instanceof Error ? e.message : 'Failed to save music');
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <AdminSectionCard title="Music track">
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
              name="audioUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audio URL</FormLabel>
                  <FormControl>
                    <Input {...field} type="url" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (seconds)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(e.target.value === '' ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artist</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="isDefault" />
                  </FormControl>
                  <FormLabel htmlFor="isDefault">Default</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="active" />
                  </FormControl>
                  <FormLabel htmlFor="active">Active</FormLabel>
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
