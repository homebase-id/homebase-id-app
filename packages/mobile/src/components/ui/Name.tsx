import { useDotYouClientContext } from 'feed-app-common';
import { useExternalOdinId } from '../../hooks/connections/useExternalOdinId';
import { useProfile } from '../../hooks/profile/useProfile';
import { memo } from 'react';
import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';

export const ConnectionName = memo(({ odinId }: { odinId: string | undefined }) => {
  const { data: connectionDetails } = useExternalOdinId({
    odinId: odinId,
  }).fetch;

  if (!odinId) return null;

  const fullName = connectionDetails?.name;

  return <>{fullName ?? odinId}</>;
});

export const AuthorName = memo(({ odinId, showYou }: { odinId?: string; showYou?: boolean }) => {
  const identity = useDotYouClientContext().getIdentity();

  if (!odinId || odinId === identity) {
    return (
      <ErrorBoundary>
        <OwnerName showYou={showYou} />
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary>
      <ConnectionName odinId={odinId} />
    </ErrorBoundary>
  );
});

export const OwnerName = memo(({ showYou }: { showYou?: boolean }) => {
  const { firstName, surName } = useProfile().data ?? {};
  if (showYou) return <>{'You'}</>;
  return (
    <>
      {firstName} {surName}
    </>
  );
});
