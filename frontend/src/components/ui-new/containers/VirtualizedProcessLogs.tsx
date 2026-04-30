import { useEffect, useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/ssr';
import RawLogText from '@/components/common/RawLogText';
import type { PatchType } from 'shared/types';

export type LogEntry = Extract<
  PatchType,
  { type: 'STDOUT' } | { type: 'STDERR' }
>;

export interface VirtualizedProcessLogsProps {
  logs: LogEntry[];
  error: string | null;
  searchQuery: string;
  matchIndices: number[];
  currentMatchIndex: number;
}

export function VirtualizedProcessLogs({
  logs,
  error,
  searchQuery,
  matchIndices,
  currentMatchIndex,
}: VirtualizedProcessLogsProps) {
  const { t } = useTranslation('tasks');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isInitialLoadRef = useRef(true);
  const prevLogsLengthRef = useRef(0);
  const prevCurrentMatchRef = useRef<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || logs.length === 0) return;
    if (isInitialLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
      prevLogsLengthRef.current = logs.length;
      return;
    }
    if (logs.length > prevLogsLengthRef.current) {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distFromBottom < 200) {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
      prevLogsLengthRef.current = logs.length;
    }
  }, [logs]);

  useEffect(() => {
    if (
      matchIndices.length > 0 &&
      currentMatchIndex >= 0 &&
      currentMatchIndex !== prevCurrentMatchRef.current
    ) {
      const logIndex = matchIndices[currentMatchIndex];
      const el = scrollRef.current?.querySelector(
        `[data-log-index="${logIndex}"]`
      );
      el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      prevCurrentMatchRef.current = currentMatchIndex;
    }
  }, [currentMatchIndex, matchIndices]);

  if (logs.length === 0 && !error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-muted-foreground text-sm">
          {t('processes.noLogsAvailable')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-destructive text-sm">
          <WarningCircleIcon className="size-icon-base inline mr-2" />
          {error}
        </p>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      {logs.map((entry, index) => {
        const isMatch = matchIndices.includes(index);
        const isCurrentMatch = matchIndices[currentMatchIndex] === index;
        return (
          <div key={`log-${index}`} data-log-index={index}>
            <RawLogText
              content={entry.content}
              channel={entry.type === 'STDERR' ? 'stderr' : 'stdout'}
              className="text-sm px-4 py-1"
              linkifyUrls
              searchQuery={isMatch ? searchQuery : undefined}
              isCurrentMatch={isCurrentMatch}
            />
          </div>
        );
      })}
    </div>
  );
}
