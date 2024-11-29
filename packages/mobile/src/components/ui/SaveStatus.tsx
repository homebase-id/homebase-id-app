import { formatToTimeAgo, t } from 'homebase-id-app-common';
import { useEffect, useState } from 'react';
import { Text } from './Text/Text';
export type ActionButtonState = 'pending' | 'loading' | 'success' | 'error' | 'idle';

export const SaveStatus = ({ state, error }: { state: ActionButtonState; error?: unknown }) => {
  const [lastSave, setLastSave] = useState<Date>();
  const [, setNow] = useState<Date>(new Date());
  useEffect(() => {
    if (state === 'success') {
      setLastSave(new Date());
    }
  }, [state]);

  // Use effect to trigger a render each 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [setNow]);

  if (state === 'loading' || state === 'pending') {
    return <Text>{t('Saving')}</Text>;
  }

  if (state === 'error') {
    return (
      <Text
        style={{
          color: 'red',
        }}
      >
        {error instanceof Error ? error.message : t('Something went wrong')}
      </Text>
    );
  }

  if (!lastSave) {
    return null;
  }

  return (
    <Text>
      {t('Last saved')} {formatToTimeAgo(lastSave)}
    </Text>
  );
};
