import { useDotYouClientContext } from 'homebase-id-app-common';
import { useExternalOdinId } from '../../hooks/connections/useExternalOdinId';
import { useProfile } from '../../hooks/profile/useProfile';
import { memo } from 'react';
import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';

export const ConnectionName = memo(
  ({ odinId, showFirstNameOnly }: { odinId: string | undefined; showFirstNameOnly?: boolean }) => {
    const { data: connectionDetails } = useExternalOdinId({
      odinId: odinId,
    }).fetch;

    if (!odinId) return null;

    const fullName = connectionDetails?.name?.trim();
    if (fullName && showFirstNameOnly) {
      const [firstName] = fullName.split(' ');
      return <>{firstName}</>;
    }

    return <>{fullName ?? odinId}</>;
  }
);

export const AuthorName = memo(
  ({
    odinId,
    showYou,
    showFirstNameOnly,
  }: {
    odinId?: string;
    showYou?: boolean;
    showFirstNameOnly?: boolean;
  }) => {
    const identity = useDotYouClientContext().getLoggedInIdentity();

    if (!odinId || odinId === identity) {
      return (
        <ErrorBoundary>
          <OwnerName showYou={showYou} showFirstNameOnly={showFirstNameOnly} />
        </ErrorBoundary>
      );
    }
    return (
      <ErrorBoundary>
        <ConnectionName odinId={odinId} showFirstNameOnly={showFirstNameOnly} />
      </ErrorBoundary>
    );
  }
);

export const OwnerName = memo(
  ({ showYou, showFirstNameOnly }: { showYou?: boolean; showFirstNameOnly?: boolean }) => {
    const { firstName, surName } = useProfile().data ?? {};
    if (showYou) return <>{'You'}</>;

    return (
      <>
        {firstName} {!showFirstNameOnly ? null : surName}
      </>
    );
  }
);
