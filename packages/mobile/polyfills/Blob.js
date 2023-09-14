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

import type {
  BlobData,
  BlobOptions,
} from 'react-native/Libraries/Blob/BlobTypes';

/**
 * Opaque JS representation of some binary data in native.
 *
 * The API is modeled after the W3C Blob API, with one caveat
 * regarding explicit deallocation. Refer to the `close()`
 * method for further details.
 *
 * Example usage in a React component:
 *
 *   class WebSocketImage extends React.Component {
 *      state = {blob: null};
 *      componentDidMount() {
 *        let ws = this.ws = new WebSocket(...);
 *        ws.binaryType = 'blob';
 *        ws.onmessage = (event) => {
 *          if (this.state.blob) {
 *            this.state.blob.close();
 *          }
 *          this.setState({blob: event.data});
 *        };
 *      }
 *      componentUnmount() {
 *        if (this.state.blob) {
 *          this.state.blob.close();
 *        }
 *        this.ws.close();
 *      }
 *      render() {
 *        if (!this.state.blob) {
 *          return <View />;
 *        }
 *        return <Image source={{uri: URL.createObjectURL(this.state.blob)}} />;
 *      }
 *   }
 *
 * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob
 */
import {
  getBlobForArrayBuffer,
  getArrayBufferForBlob,
} from 'react-native-blob-jsi-helper';
import { uint8ArrayToBase64 } from '@youfoundation/js-lib/helpers';

class Blob {
  _data: ?BlobData;

  /**
   * Constructor for JS consumers.
   * Currently we only support creating Blobs from other Blobs.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/Blob
   */
  constructor(
    parts: Array<Blob | string | Uint8Array> = [],
    options?: BlobOptions,
  ) {
    const BlobManager = require('react-native/Libraries/Blob/BlobManager');
    if (
      Array.isArray(parts) &&
      parts.length === 1 &&
      parts[0] instanceof Uint8Array
    ) {
      const innerBlob = getBlobForArrayBuffer(parts[0].buffer);
      // this.data = BlobManager.createFromParts([innerBlob], options).data;

      this.data = innerBlob.data;
    } else {
      this.data = BlobManager.createFromParts(parts, options).data;
    }
  }

  /*
   * This method is used to create a new Blob object containing
   * the data in the specified range of bytes of the source Blob.
   * Reference: https://developer.mozilla.org/en-US/docs/Web/API/Blob/slice
   */
  // $FlowFixMe[unsafe-getters-setters]
  set data(data: ?BlobData) {
    const buffer = getArrayBufferForBlob({ _data: data });
    const uri = `data:${data.type};base64,${uint8ArrayToBase64(buffer)}`;
    this.uri = uri;

    this._data = data;
  }

  // $FlowFixMe[unsafe-getters-setters]
  get data(): BlobData {
    if (!this._data) {
      throw new Error('Blob has been closed and is no longer available');
    }

    return this._data;
  }

  slice(start?: number, end?: number): Blob {
    const BlobManager = require('react-native/Libraries/Blob/BlobManager');
    let { offset, size } = this.data;

    if (typeof start === 'number') {
      if (start > size) {
        // $FlowFixMe[reassign-const]
        start = size;
      }
      offset += start;
      size -= start;

      if (typeof end === 'number') {
        if (end < 0) {
          // $FlowFixMe[reassign-const]
          end = this.size + end;
        }
        if (end > this.size) {
          // $FlowFixMe[reassign-const]
          end = this.size;
        }
        size = end - start;
      }
    }
    return BlobManager.createFromOptions({
      blobId: this.data.blobId,
      offset,
      size,
      /* Since `blob.slice()` creates a new view onto the same binary
       * data as the original blob, we should re-use the same collector
       * object so that the underlying resource gets deallocated when
       * the last view into the data is released, not the first.
       */
      __collector: this.data.__collector,
    });
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
    const BlobManager = require('react-native/Libraries/Blob/BlobManager');
    BlobManager.release(this.data.blobId);
    this.data = null;
  }

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

module.exports = Blob;
