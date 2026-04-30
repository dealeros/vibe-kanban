import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import DisplayConversationEntry from '../NormalizedConversation/DisplayConversationEntry';
import { useEntries } from '@/contexts/EntriesContext';
import {
  AddEntryType,
  PatchTypeWithKey,
  useConversationHistory,
} from '@/hooks/useConversationHistory';
import { Loader2 } from 'lucide-react';
import { TaskWithAttemptStatus } from 'shared/types';
import type { WorkspaceWithSession } from '@/types/attempt';
import { ApprovalFormProvider } from '@/contexts/ApprovalFormContext';

interface VirtualizedListProps {
  attempt: WorkspaceWithSession;
  task?: TaskWithAttemptStatus;
}

const renderEntry = (
  data: PatchTypeWithKey,
  attempt: WorkspaceWithSession,
  task?: TaskWithAttemptStatus
) => {
  if (data.type === 'STDOUT') return <p>{data.content}</p>;
  if (data.type === 'STDERR') return <p>{data.content}</p>;
  if (data.type === 'NORMALIZED_ENTRY') {
    return (
      <DisplayConversationEntry
        expansionKey={data.patchKey}
        entry={data.content}
        executionProcessId={data.executionProcessId}
        taskAttempt={attempt}
        task={task}
      />
    );
  }
  return null;
};

const VirtualizedList = ({ attempt, task }: VirtualizedListProps) => {
  const [entries, setEntriesState] = useState<PatchTypeWithKey[]>([]);
  const [loading, setLoading] = useState(true);
  const { setEntries, reset } = useEntries();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    setLoading(true);
    setEntriesState([]);
    reset();
    isInitialLoadRef.current = true;
  }, [attempt.id, reset]);

  const onEntriesUpdated = (
    newEntries: PatchTypeWithKey[],
    _addType: AddEntryType,
    newLoading: boolean
  ) => {
    setEntriesState(newEntries);
    setEntries(newEntries);
    if (loading) setLoading(newLoading);
  };

  useConversationHistory({ attempt, onEntriesUpdated });

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

  return (
    <ApprovalFormProvider>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="h-2" />
        {entries.map((data) => (
          <div key={`l-${data.patchKey}`}>
            {renderEntry(data, attempt, task)}
          </div>
        ))}
        <div className="h-2" />
      </div>
      {loading && (
        <div className="float-left top-0 left-0 w-full h-full bg-primary flex flex-col gap-2 justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading History</p>
        </div>
      )}
    </ApprovalFormProvider>
  );
};

export default VirtualizedList;
