'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminDeleteDialog } from '@/components/admin/AdminDeleteDialog';
import { TemplateFieldForm } from '@/components/admin/forms/TemplateFieldForm';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { TemplateField } from '@/types/template-field';
import type { TemplateListItem, TemplateListResult } from '@/types/template';
import { toast } from 'sonner';

export function TemplateFieldsListClient() {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [fields, setFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    adminFetch<TemplateListResult & { totalCount: number }>('/api/admin/templates?limit=100')
      .then((r) => setTemplates(r.data?.items ?? []))
      .catch(() => toast.error('Failed to load templates'));
  }, []);

  const loadFields = useCallback(async (tid: string) => {
    if (!tid) {
      setFields([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<{ items: TemplateField[] }>(
        `/api/admin/template-fields?templateId=${encodeURIComponent(tid)}`,
      );
      setFields(res.data?.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load fields');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFields(templateId);
  }, [templateId, loadFields]);

  async function reorder(fieldIds: string[]) {
    if (!templateId) return;
    try {
      await adminFetch('/api/admin/template-fields', {
        method: 'PUT',
        body: JSON.stringify({ templateId, fieldIds }),
      });
      await loadFields(templateId);
      toast.success('Fields reordered');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Reorder failed');
    }
  }

  function moveField(index: number, dir: -1 | 1) {
    const next = [...fields];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    void reorder(next.map((f) => f.id));
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await adminFetch(`/api/admin/template-fields/${deleteId}`, { method: 'DELETE' });
      toast.success('Field deleted');
      setDeleteId(null);
      await loadFields(templateId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <AdminPageHeader
        title="Template Fields"
        description="Define dynamic fields per template."
        actions={
          <Button disabled={!templateId} onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" /> Create field
          </Button>
        }
      />
      <AdminFilters>
        <Select value={templateId || 'none'} onValueChange={(v) => setTemplateId(v === 'none' ? '' : v)}>
          <SelectTrigger className="w-full max-w-md">
            <SelectValue placeholder="Filter by template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Select a template</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminFilters>

      {!templateId ? (
        <AdminEmptyState title="Select a template" description="Choose a template to view and manage its fields." />
      ) : loading ? (
        <Skeleton className="h-48 w-full" />
      ) : error ? (
        <ErrorState description={error} onRetry={() => void loadFields(templateId)} />
      ) : fields.length === 0 ? (
        <AdminEmptyState title="No fields yet" description="Create the first field for this template." />
      ) : (
        <AdminTable
          columns={[
            { key: 'key', header: 'Key', cell: (r) => r.key },
            { key: 'label', header: 'Label', cell: (r) => r.label },
            { key: 'type', header: 'Type', cell: (r) => r.fieldType.toUpperCase() },
            { key: 'order', header: 'Order', cell: (r) => r.sortOrder },
            {
              key: 'req',
              header: 'Required',
              cell: (r) => (r.required ? 'Yes' : 'No'),
            },
            {
              key: 'actions',
              header: 'Actions',
              cell: (r) => {
                const idx = fields.findIndex((f) => f.id === r.id);
                return (
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="size-8" onClick={() => moveField(idx, -1)} aria-label="Move up">
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="size-8" onClick={() => moveField(idx, 1)} aria-label="Move down">
                      <ArrowDown className="size-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={adminRoutes.templateFieldEdit(r.id)}><Pencil className="size-3.5" /></Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setDeleteId(r.id); setDeleteName(r.label); }}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                );
              },
            },
          ]}
          rows={fields}
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create field</DialogTitle>
          </DialogHeader>
          <TemplateFieldForm
            templateId={templateId}
            showTemplateId={false}
            cancelHref="#"
            submitLabel="Create"
            onSubmit={async (values) => {
              await adminFetch('/api/admin/template-fields', {
                method: 'POST',
                body: JSON.stringify(values),
              });
              setCreateOpen(false);
              await loadFields(templateId);
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AdminDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(o) => !o && setDeleteId(null)}
        entityName={deleteName}
        onConfirm={() => void confirmDelete()}
        loading={deleting}
      />
    </>
  );
}
