import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import NewDisplayConversationEntry from './NewDisplayConversationEntry';
import { ApprovalFormProvider } from '@/contexts/ApprovalFormContext';
import { useEntries } from '@/contexts/EntriesContext';
import {
  AddEntryType,
  PatchTypeWithKey,
  useConversationHistory,
} from '@/hooks/useConversationHistory';
import type { WorkspaceWithSession } from '@/types/attempt';

interface ConversationListProps {
  attempt: WorkspaceWithSession;
}

const renderEntry = (
  data: PatchTypeWithKey,
  attempt: WorkspaceWithSession
) => {
  if (data.type === 'STDOUT') return <p>{data.content}</p>;
  if (data.type === 'STDERR') return <p>{data.content}</p>;
  if (data.type === 'NORMALIZED_ENTRY') {
    return (
      <NewDisplayConversationEntry
        expansionKey={data.patchKey}
        entry={data.content}
        executionProcessId={data.executionProcessId}
        taskAttempt={attempt}
      />
    );
  }
  return null;
};

export function ConversationList({ attempt }: ConversationListProps) {
  const [entries, setEntriesState] = useState<PatchTypeWithKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { setEntries, reset } = useEntries();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const pendingUpdateRef = useRef<{
    entries: PatchTypeWithKey[];
    addType: AddEntryType;
    loading: boolean;
  } | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoading(true);
    setEntriesState([]);
    reset();
    isInitialLoadRef.current = true;
  }, [attempt.id, reset]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const onEntriesUpdated = (
    newEntries: PatchTypeWithKey[],
    addType: AddEntryType,
    newLoading: boolean
  ) => {
    pendingUpdateRef.current = {
      entries: newEntries,
      addType,
      loading: newLoading,
    };
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    debounceTimeoutRef.current = setTimeout(() => {
      const pending = pendingUpdateRef.current;
      if (!pending) return;
      setEntriesState(pending.entries);
      setEntries(pending.entries);
      if (loading) setLoading(pending.loading);
    }, 100);
  };

  useConversationHistory({ attempt, onEntriesUpdated });

  // Initial load: jump to bottom (no animation). Subsequent updates: smooth-
  // scroll to bottom only if the user is already near the bottom, so we do
  // not yank them away while they are reading earlier entries.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || entries.length === 0) return;
    if (isInitialLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
      return;
    }
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 200) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }
  }, [entries]);

  const hasContent = !loading || entries.length > 0;

  return (
    <ApprovalFormProvider>
      <div
        ref={scrollRef}
        className={cn(
          'h-full overflow-y-auto scrollbar-none transition-opacity duration-300',
          hasContent ? 'opacity-100' : 'opacity-0'
        )}
      >
        <div className="h-2" />
        {entries.map((data) => (
          <div key={`conv-${data.patchKey}`}>{renderEntry(data, attempt)}</div>
        ))}
        <div className="h-2" />
      </div>
    </ApprovalFormProvider>
  );
}

export default ConversationList;
