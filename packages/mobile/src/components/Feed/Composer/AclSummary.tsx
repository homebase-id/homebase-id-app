import { AccessControlList, SecurityGroupType } from '@homebase-id/js-lib/core';
import { stringGuidsEqual } from '@homebase-id/js-lib/helpers';
import { t, ellipsisAtMaxChar } from 'homebase-id-app-common';
import { useCircles } from '../../../hooks/circles/useCircles';
import { IconProps, OpenLock, Lock } from '../../ui/Icons/icons';
import { memo, useMemo } from 'react';

export const AclSummary = memo(
  ({ acl, maxLength = 40 }: { acl: AccessControlList; maxLength?: number }) => {
    const { data: circles } = useCircles().fetch;

    const circlesDetails = useMemo(
      () =>
        acl?.circleIdList?.map(
          (circleId) => circles?.find((circle) => stringGuidsEqual(circle.id || '', circleId))?.name
        ),
      [acl, circles]
    );

    return (
      <>
        {!acl ||
        acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Anonymous.toLowerCase()
          ? t('Public')
          : acl.requiredSecurityGroup.toLowerCase() ===
              SecurityGroupType.Authenticated.toLowerCase()
            ? t('Authenticated')
            : acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Connected.toLowerCase()
              ? acl.circleIdList?.length
                ? `${t('Circles')}: ${ellipsisAtMaxChar(circlesDetails?.join(', '), maxLength)}`
                : t('Connections')
              : acl.requiredSecurityGroup.toLowerCase() === SecurityGroupType.Owner.toLowerCase()
                ? t('Owner')
                : t('Owner')}
      </>
    );
  }
);

export const AclIcon = memo(({ acl, ...props }: { acl: AccessControlList } & IconProps) => {
  return !acl ||
    acl.requiredSecurityGroup === SecurityGroupType.Anonymous.toLowerCase() ||
    acl.requiredSecurityGroup === SecurityGroupType.Authenticated.toLowerCase() ? (
    <OpenLock {...props} />
  ) : (
    <Lock {...props} />
  );
});
