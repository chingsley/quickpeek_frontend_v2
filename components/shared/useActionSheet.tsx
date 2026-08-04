import ActionSheet, { ActionSheetConfig } from '@/components/shared/ActionSheet';
import React, { useCallback, useState } from 'react';

/**
 * Holds the visible/config state for an ActionSheet so call sites read like
 * Alert.alert: `showActionSheet({ title, message, tone, buttons })` and
 * render `{actionSheet}` once near the screen root.
 */
export const useActionSheet = () => {
  const [config, setConfig] = useState<ActionSheetConfig | null>(null);

  const showActionSheet = useCallback((next: ActionSheetConfig) => setConfig(next), []);
  const hideActionSheet = useCallback(() => setConfig(null), []);

  const actionSheet = (
    <ActionSheet
      visible={config !== null}
      onClose={hideActionSheet}
      title={config?.title ?? ''}
      message={config?.message}
      tone={config?.tone}
      buttons={config?.buttons}
    />
  );

  return { showActionSheet, hideActionSheet, actionSheet };
};
