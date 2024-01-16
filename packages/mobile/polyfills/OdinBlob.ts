/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

type BlobData = any;
type BlobOptions = any;
/**
 * Opaque JS representation of some binary data in native.
 *
 * The API is modeled after the W3C Blob API, with one caveat
 * regarding explicit deallocation. Refer to the `close()`
 * method for further details.
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
import { base64ToUint8Array, getNewId, uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';
import { Dirs, FileSystem } from 'react-native-file-access';

class Blob {
  _data: BlobData;
  uri: string;

  /**
   * Constructor for JS consumers.
   * RN: Currently we only support creating Blobs from other Blobs.
   * Homebase: We support creating Blobs from Uint8Arrays by converting them to base64 and writing them to a file.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
   */
  constructor(parts: Array<Blob | string | Uint8Array> = [], options?: BlobOptions) {
    if (Array.isArray(parts) && parts.length === 1 && parts[0] instanceof Uint8Array) {
      const id = getNewId();
      this.data = {
        blobId: id,
        offset: 0,
        size: parts[0].length,
        type: options?.type || 'application/octet-stream',
        __collector: null,
      };

      const localPath = Dirs.CacheDir + `/${id}`;
      FileSystem.writeFile(localPath, uint8ArrayToBase64(parts[0]), 'base64');

      // We need to convert to a cached file on the system, as RN is dumb that way... It can't handle blobs in a data uri, as it will always load it as a bitmap... 🤷
      // See getFileInputStream in RequestBodyUtil.class within RN for more info
      this.uri = `file://${localPath}`;
    } else throw new Error('Unsupported Blob constructor arguments');
  }

  /*
   * This method is used to create a new Blob object containing
   * the data in the specified range of bytes of the source Blob.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice
   */
  // $FlowFixMe[unsafe-getters-setters]
  set data(data: BlobData) {
    this._data = data;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get data(): BlobData {
    if (!this._data) throw new Error('Blob has been closed and is no longer available');

    return this._data;
  }

  /**
   * This method is in the standard, but not actually implemented by
   * any browsers at this point. It's important for how Blobs work in
   * React Native, however, since we cannot de-allocate resources automatically,
   * so consumers need to explicitly de-allocate them.
   *
   * Note that the semantics around Blobs created via `blob.slice()`
   * and `new Blob([blob])` are different. `blob.slice()` creates a
   * new *view* onto the same binary data, so calling `close()` on any
   * of those views is enough to deallocate the data, whereas
   * `new Blob([blob, ...])` actually copies the data in memory.
   */
  close() {
    // const BlobManager = require('react-native/Libraries/Blob/BlobManager');
    // BlobManager.release(this.data.blobId);
    FileSystem.unlink(this.uri);
    this.data = null;
  }

  arrayBuffer(): Promise<ArrayBuffer> {
    return FileSystem.readFile(this.uri, 'base64')
      .then((base64) => {
        if (!base64) return new Uint8Array(0).buffer;
        console.log('base64', base64.slice(0, 10));

        return base64ToUint8Array(base64).buffer;
      })
      .catch((err) => {
        console.log('err', err);
        return new Uint8Array(0).buffer;
      });
  }

  // arrayBuffer(): Promise<ArrayBuffer> {
  //   console.log('arrayBuffer', this.uri);

  //   return FileSystem.exists(this.uri)
  //     .then((exists) => {
  //       console.log('exists', exists);
  //       return FileSystem.readFile(this.uri, 'base64');
  //     })
  //     .then((base64) => {
  //       if (!base64) return new Uint8Array(0).buffer;
  //       console.log('base64', base64.slice(0, 10));

  //       return base64ToUint8Array(base64).buffer;
  //     })
  //     .catch((err) => {
  //       console.log('err', err);
  //       return new Uint8Array(0).buffer;
  //     });
  // }

  /**
   * Size of the data contained in the Blob object, in bytes.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get size(): number {
    return this.data.size;
  }

  /*
   * String indicating the MIME type of the data contained in the Blob.
   * If the type is unknown, this string is empty.
   */
  // $FlowFixMe[unsafe-getters-setters]
  get type(): string {
    return this.data.type || '';
  }
}

export { Blob as OdinBlob };
