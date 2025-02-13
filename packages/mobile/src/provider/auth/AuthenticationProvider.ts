import { Buffer } from 'buffer';
import { exchangeDigestForToken } from '@homebase-id/js-lib/auth';
import { DotYouClient, ApiType } from '@homebase-id/js-lib/core';
import { base64ToUint8Array, uint8ArrayToBase64, cbcDecrypt } from '@homebase-id/js-lib/helpers';

import crypto from 'react-native-quick-crypto';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).crypto.getRandomValues = crypto.getRandomValues;
import hkdf from 'js-crypto-hkdf'; // for npm
import elliptic from 'elliptic';

export const createEccPair = async () => {
  // Create and initialize EC context
  // (better do it once and reuse it)
  const ec = new elliptic.ec('p384');

  // Generate keys
  const pk = ec.genKeyPair();
  const x = pk.getPublic().getX();
  const y = pk.getPublic().getY();

  const jwkEC = {
    kty: 'EC',
    crv: 'P-384',
    x: uint8ArrayToBase64(new Uint8Array(x.toArray())),
    y: uint8ArrayToBase64(new Uint8Array(y.toArray())),
  };

  return {
    privateKeyHex: pk.getPrivate('hex'),
    publicKeyJwk: jwkEC,
  };
};

export const finalizeAuthentication = async (
  identity: string,
  privateKeyHex: string,
  publicKeyJwk: { x: string; y: string },
  salt: string
) => {
  const privateCurve = new elliptic.ec('p384');
  const privateKey = privateCurve.keyFromPrivate(privateKeyHex, 'hex');

  const curve = new elliptic.ec('p384');
  const remotePublicKey = curve.keyFromPublic({
    x: Buffer.from(base64ToUint8Array(publicKeyJwk.x.replace(/-/g, '+').replace(/_/g, '/'))),
    y: Buffer.from(base64ToUint8Array(publicKeyJwk.y.replace(/-/g, '+').replace(/_/g, '/'))),
  } as unknown as elliptic.ec.KeyPair);

  const derivedBits = privateKey.derive(remotePublicKey.getPublic()).toArray();

  const exchangedSecret = (
    await hkdf.compute(
      new Uint8Array(derivedBits),
      'SHA-256',
      16,
      undefined,
      base64ToUint8Array(salt)
    )
  ).key;

  const exchangedSecretDigest = new Uint8Array(
    crypto.createHash('sha256').update(new Uint8Array(exchangedSecret)).digest()
  );

  const base64ExchangedSecretDigest = uint8ArrayToBase64(exchangedSecretDigest);
  const dotYouClient = new DotYouClient({
    api: ApiType.App,
    loggedInIdentity: identity,
    hostIdentity: identity,
  });

  const token = await exchangeDigestForToken(dotYouClient, base64ExchangedSecretDigest);

  const sharedSecretCipher = base64ToUint8Array(token.base64SharedSecretCipher);
  const sharedSecretIv = base64ToUint8Array(token.base64SharedSecretIv);
  const sharedSecret = await cbcDecrypt(sharedSecretCipher, sharedSecretIv, exchangedSecret);

  const clientAuthTokenCipher = base64ToUint8Array(token.base64ClientAuthTokenCipher);
  const clientAuthTokenIv = base64ToUint8Array(token.base64ClientAuthTokenIv);
  const clientAuthToken = await cbcDecrypt(
    clientAuthTokenCipher,
    clientAuthTokenIv,
    exchangedSecret
  );

  return { clientAuthToken, sharedSecret };
};
