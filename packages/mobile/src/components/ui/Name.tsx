import { useDotYouClientContext } from 'feed-app-common';
import { useExternalOdinId } from '../../hooks/connections/useExternalOdinId';
import { useProfile } from '../../hooks/profile/useProfile';
import { memo } from 'react';

export const ConnectionName = memo(({ odinId }: { odinId: string | undefined }) => {
  const { data: connectionDetails } = useExternalOdinId({
    odinId: odinId,
  }).fetch;

  if (!odinId) return null;

  const fullName = connectionDetails?.name;

  return <>{fullName ?? odinId}</>;
});

export const AuthorName = memo(({ odinId }: { odinId?: string }) => {
  const identity = useDotYouClientContext().getIdentity();

  if (!odinId || odinId === identity) return <OwnerName />;
  return <ConnectionName odinId={odinId} />;
});

export const OwnerName = memo(() => {
  const { firstName, surName } = useProfile().data ?? {};
  return (
    <>
      {firstName} {surName}
    </>
  );
});
