import {
  stringifyToQueryParams,
  getUniqueDrivesWithHighestPermission,
  stringGuidsEqual,
} from '@youfoundation/js-lib/helpers';
import { AppPermissionType } from '@youfoundation/js-lib/network';
import { getExtendAppRegistrationParams } from '@youfoundation/js-lib/auth';
import { useDotYouClientContext } from '../auth/useDotYouClientContext';
import { useSecurityContext } from './useSecurityContext';

const getExtendAppRegistrationUrl = (
  host: string,
  appId: string,
  drives: { a: string; t: string; n: string; d: string; p: number }[],
  circleDrives: { a: string; t: string; n: string; d: string; p: number }[] | undefined,
  permissionKeys: number[],
  needsAllConnected: boolean,
  returnUrl: string
) => {
  const params = getExtendAppRegistrationParams(
    appId,
    drives,
    circleDrives,
    permissionKeys,
    needsAllConnected,
    returnUrl
  );

  return `${host}/owner/appupdate?${stringifyToQueryParams(params)}`;
};

export const useMissingPermissions = ({
  appId,
  drives,
  circleDrives,
  permissions,
  needsAllConnected,
}: {
  appId: string;
  drives: {
    a: string;
    t: string;
    n: string;
    d: string;
    p: number;
  }[];
  circleDrives?:
    | {
        a: string;
        t: string;
        n: string;
        d: string;
        p: number;
      }[]
    | undefined;
  permissions: AppPermissionType[];
  needsAllConnected?: boolean;
}) => {
  const { data: context } = useSecurityContext().fetch;
  const host = useDotYouClientContext().getRoot();

  if (!context || !host) return;

  const driveGrants = context?.permissionContext.permissionGroups.flatMap(
    (group) => group.driveGrants
  );
  const uniqueDriveGrants = driveGrants ? getUniqueDrivesWithHighestPermission(driveGrants) : [];

  const permissionKeys = context?.permissionContext.permissionGroups.flatMap(
    (group) => group.permissionSet.keys
  );

  const missingDrives = drives.filter((drive) => {
    const matchingGrants = uniqueDriveGrants.filter(
      (grant) =>
        stringGuidsEqual(grant.permissionedDrive.drive.alias, drive.a) &&
        stringGuidsEqual(grant.permissionedDrive.drive.type, drive.t)
    );

    const hasAccess = matchingGrants.some((grant) => {
      const allPermissions = grant.permissionedDrive.permission.reduce((a, b) => a + b, 0);
      return allPermissions >= drive.p;
    });

    return !hasAccess;
  });

  const missingPermissions = permissions?.filter((key) => permissionKeys?.indexOf(key) === -1);

  const hasAllConnectedCircle = context?.caller.isGrantedConnectedIdentitiesSystemCircle;
  const missingAllConnectedCircle = (needsAllConnected && !hasAllConnectedCircle) || false;

  if (missingDrives.length === 0 && missingPermissions.length === 0 && !missingAllConnectedCircle)
    return;

  const extendPermissionUrl = getExtendAppRegistrationUrl(
    host,
    appId,
    missingDrives,
    circleDrives,
    missingPermissions,
    missingAllConnectedCircle,
    'homebase-fchat://'
  );

  return extendPermissionUrl;
};
