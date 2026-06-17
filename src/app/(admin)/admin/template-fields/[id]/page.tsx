'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { TemplateFieldForm } from '@/components/admin/forms/TemplateFieldForm';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateField } from '@/types/template-field';
import type { CreateFieldInput } from '@/validations/template-field.validation';
import { toast } from 'sonner';

function parseValidationRules(field: TemplateField): CreateFieldInput['validationRules'] {
  const rules: Record<string, unknown> = {};
  if (field.maxLength != null) rules.maxLength = field.maxLength;
  if (field.helpText) {
    try {
      Object.assign(rules, JSON.parse(field.helpText) as Record<string, unknown>);
    } catch {
      return field.maxLength != null ? { maxLength: field.maxLength } : null;
    }
  }
  return Object.keys(rules).length ? rules : null;
}

export default function AdminTemplateFieldEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [field, setField] = useState<TemplateField | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminFetch<{ field: TemplateField }>(`/api/admin/template-fields/${id}`)
      .then((r) => setField(r.data?.field ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (error || !field) return <ErrorState description={error ?? 'Field not found'} />;

  return (
    <>
      <AdminPageHeader
        title={`Edit field: ${field.label}`}
        actions={
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 size-4" /> Delete
          </Button>
        }
      />
      <TemplateFieldForm
        cancelHref={adminRoutes.templateFields}
        submitLabel="Update field"
        showTemplateId={false}
        defaultValues={{
          templateId: field.templateId,
          fieldKey: field.key,
          fieldLabel: field.label,
          fieldType: field.fieldType as CreateFieldInput['fieldType'],
          placeholder: field.placeholder,
          required: field.required,
          sortOrder: field.sortOrder,
          validationRules: parseValidationRules(field),
        }}
        onSubmit={async (values) => {
          const { templateId: _tid, ...update } = values;
          await adminFetch(`/api/admin/template-fields/${id}`, {
            method: 'PUT',
            body: JSON.stringify(update),
          });
          router.push(adminRoutes.templateFields);
        }}
      />
      <AdminDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        entityName={field.label}
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await adminFetch(`/api/admin/template-fields/${id}`, { method: 'DELETE' });
            toast.success('Field deleted');
            router.push(adminRoutes.templateFields);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Delete failed');
          } finally {
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
