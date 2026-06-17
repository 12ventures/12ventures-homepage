import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface InlineEditContextValue {
  activeBlockId: string | null;
  startEdit: (blockId: string) => boolean;
  stopEdit: () => void;
  isEditing: (blockId: string) => boolean;
}

const InlineEditContext = createContext<InlineEditContextValue | null>(null);

export const InlineEditProvider: React.FC<{
  children: React.ReactNode;
  /** When this value changes, any active inline edit is cancelled */
  resetTrigger?: unknown;
}> = ({ children, resetTrigger }) => {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);

  const startEdit = useCallback((blockId: string) => {
    if (activeBlockId !== null && activeBlockId !== blockId) {
      return false;
    }
    setActiveBlockId(blockId);
    return true;
  }, [activeBlockId]);

  const stopEdit = useCallback(() => {
    setActiveBlockId(null);
  }, []);

  useEffect(() => {
    if (resetTrigger === undefined) return;
    setActiveBlockId(null);
  }, [resetTrigger]);

  const isEditing = useCallback(
    (blockId: string) => activeBlockId === blockId,
    [activeBlockId],
  );

  const value = useMemo(
    () => ({ activeBlockId, startEdit, stopEdit, isEditing }),
    [activeBlockId, startEdit, stopEdit, isEditing],
  );

  return <InlineEditContext.Provider value={value}>{children}</InlineEditContext.Provider>;
};

export function useInlineEdit() {
  const ctx = useContext(InlineEditContext);
  if (!ctx) {
    throw new Error('useInlineEdit must be used within InlineEditProvider');
  }
  return ctx;
}
