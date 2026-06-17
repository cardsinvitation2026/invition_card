'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RuntimeForm } from '@/components/runtime-form/RuntimeForm';
import {
  RuntimeFormEmptyState,
  RuntimeFormErrorState,
  RuntimeTemplateLoadingState,
} from '@/components/runtime-form/RuntimeFormStates';
import { DraftSaveStatus } from '@/components/drafts/DraftSaveStatus';
import { PersonalizedRemotionPreview } from '@/components/preview/PersonalizedRemotionPreview';
import { useDraftAutosave } from '@/features/drafts/autosave/useDraftAutosave';
import { buildDefaultFormValues } from '@/features/runtime-form/field-validator';
import { fetchDraft, fetchDraftsForTemplate } from '@/lib/drafts/api';
import { useRuntimePreviewData } from '@/remotion/hooks/useRuntimePreviewData';
import type { ApiResponse } from '@/types/api';
import type {
  RuntimeFormDefinition,
  RuntimeFormDefinitionResponse,
  RuntimeFormValues,
} from '@/types/form-runtime';

export function TemplateEditPageClient({
  slug,
  musicUrl,
}: {
  slug: string;
  musicUrl: string | null;
}) {
  const [definition, setDefinition] = useState<RuntimeFormDefinitionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [restoredValues, setRestoredValues] = useState<RuntimeFormValues | undefined>();
  const [restoring, setRestoring] = useState(false);
  const [formValues, setFormValues] = useState<RuntimeFormValues>({});

  const previewInputProps = useRuntimePreviewData(
    definition?.template ?? null,
    formValues,
    musicUrl,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(slug)}/form-definition`, {
        credentials: 'include',
      });
      const data = (await res.json()) as ApiResponse<RuntimeFormDefinitionResponse>;
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? `Failed to load (${res.status})`);
      }
      const def = data.data ?? null;
      setDefinition(def);

      if (def) {
        setRestoring(true);
        try {
          const draftsRes = await fetchDraftsForTemplate(def.template.id);
          const existing = draftsRes.data?.items[0];
          if (existing) {
            const detail = await fetchDraft(existing.id);
            setDraftId(detail.data?.draft.id ?? null);
            setRestoredValues(detail.data?.values);
            setFormValues(detail.data?.values ?? {});
          } else {
            setFormValues(
              buildDefaultFormValues({
                templateId: def.template.id,
                templateSlug: def.template.slug,
                templateName: def.template.name,
                fields: def.fields,
                sections: def.sections,
              }),
            );
          }
        } catch {
          // Draft restore is optional; form still loads.
        } finally {
          setRestoring(false);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load template form');
      setDefinition(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const { status: autosaveStatus, saveNow } = useDraftAutosave({
    draftId,
    templateId: definition?.template.id ?? '',
    values: formValues,
    enabled: Boolean(definition?.fields.length) && !restoring,
    onDraftCreated: setDraftId,
    initialSerialized: restoredValues ? JSON.stringify(restoredValues) : undefined,
  });

  async function handleManualSave() {
    const ok = await saveNow();
    if (ok) {
      toast.success('Draft saved');
    } else {
      toast.error('Failed to save draft');
    }
  }

  if (loading) {
    return <RuntimeTemplateLoadingState />;
  }

  if (error) {
    return <RuntimeFormErrorState message={error} onRetry={() => void load()} />;
  }

  if (!definition) {
    return <RuntimeFormErrorState message="Template form definition not found." />;
  }

  const formDefinition: RuntimeFormDefinition = {
    templateId: definition.template.id,
    templateSlug: definition.template.slug,
    templateName: definition.template.name,
    fields: definition.fields,
    sections: definition.sections,
  };

  return (
    <div className="container max-w-7xl py-8">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href={`/templates/${slug}`}>
            <ArrowLeft className="mr-2 size-4" />
            Back to template
          </Link>
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Personalise: {definition.template.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your progress is saved automatically. The preview updates as you type.
            </p>
          </div>
          <DraftSaveStatus status={autosaveStatus} restoring={restoring} />
        </div>
      </div>

      {definition.fields.length === 0 ? (
        <RuntimeFormEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <RuntimeForm
              definition={formDefinition}
              restoredValues={restoredValues}
              onValuesChange={setFormValues}
              onPreviewGenerated={() => {}}
              onSaveDraft={handleManualSave}
            />
          </div>
          <div className="min-w-0 lg:sticky lg:top-6">
            <div className="mb-3">
              <h2 className="text-lg font-semibold tracking-tight">Live preview</h2>
              <p className="text-xs text-muted-foreground">
                Powered by Remotion — reflects your current form values.
              </p>
            </div>
            <PersonalizedRemotionPreview
              templateSlug={definition.template.slug}
              templateType={definition.template.type}
              inputProps={previewInputProps}
            />
          </div>
        </div>
      )}
    </div>
  );
}
