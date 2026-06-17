'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTOSAVE_DEBOUNCE_MS } from '@/features/drafts/autosave/autosave.constants';
import { createDraft, updateDraft } from '@/lib/drafts/api';
import type { RuntimeFormValues } from '@/types/form-runtime';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useDraftAutosave({
  draftId,
  templateId,
  values,
  enabled,
  onDraftCreated,
  initialSerialized,
}: {
  draftId: string | null;
  templateId: string;
  values: RuntimeFormValues;
  enabled: boolean;
  onDraftCreated: (id: string) => void;
  initialSerialized?: string;
}) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const lastSavedRef = useRef<string>(initialSerialized ?? '');
  const inFlightRef = useRef(false);
  const draftIdRef = useRef(draftId);

  useEffect(() => {
    draftIdRef.current = draftId;
  }, [draftId]);

  useEffect(() => {
    if (initialSerialized) {
      lastSavedRef.current = initialSerialized;
    }
  }, [initialSerialized]);

  const persist = useCallback(
    async (payload: RuntimeFormValues, currentDraftId: string | null) => {
      if (inFlightRef.current) {
        return false;
      }
      inFlightRef.current = true;
      setStatus('saving');
      try {
        if (currentDraftId) {
          await updateDraft(currentDraftId, payload);
        } else {
          const res = await createDraft(templateId, payload);
          const newId = res.data?.draft.id;
          if (newId) {
            draftIdRef.current = newId;
            onDraftCreated(newId);
          }
        }
        lastSavedRef.current = JSON.stringify(payload);
        setStatus('saved');
        return true;
      } catch {
        setStatus('error');
        return false;
      } finally {
        inFlightRef.current = false;
      }
    },
    [templateId, onDraftCreated],
  );

  const saveNow = useCallback(async () => {
    return persist(values, draftIdRef.current);
  }, [persist, values]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const serialized = JSON.stringify(values);
    if (serialized === lastSavedRef.current) {
      return;
    }

    const timer = setTimeout(() => {
      void persist(values, draftIdRef.current);
    }, AUTOSAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [values, enabled, persist]);

  return { status, saveNow };
}
