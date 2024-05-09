import { NewPayloadDescriptor, PayloadDescriptor, TargetDrive } from '@youfoundation/js-lib/core';
import { memo, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import { Download, Pdf } from '../Icons/icons';
import { Text } from '../Text/Text';
import { getPayloadSize } from '../../../utils/utils';
import { useFile } from '../../../hooks/file/useFile';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { OdinBlob } from '../../../../polyfills/OdinBlob';

export const BoringFile = memo(
  ({
    odinId,
    targetDrive,
    fileId,
    file,
  }: {
    odinId: string | undefined;
    targetDrive: TargetDrive;
    fileId: string;
    file: PayloadDescriptor | NewPayloadDescriptor;
  }) => {
    const { fetchFile, downloadFile } = useFile({ targetDrive });
    const [loading, setLoading] = useState(false);
    const [blob, setBlob] = useState<OdinBlob | null>(null);

    const downloadAndOpen = async () => {
      setLoading(true);
      const payload = await downloadFile(odinId, fileId, file.key);
      setLoading(false);
      if (!payload) return;
      else {
        console.log('payload', payload);
        setBlob(payload);
        await openDocument(payload);
      }
    };

    const openDocument = async (payload?: OdinBlob) => {
      if (!blob && !payload) {
        console.error('No file to open');
        return;
      }
      const uri = blob?.uri || payload?.uri;
      if (!uri) {
        return;
      }
      if (Platform.OS === 'ios') {
        await ReactNativeBlobUtil.ios.openDocument(uri);
      } else if (Platform.OS === 'android') {
        try {
          await ReactNativeBlobUtil.android.actionViewIntent(
            uri,
            blob?.type || payload?.type || 'application/pdf'
          );
        } catch (error) {
          console.error('Error opening document', error);
        }
      }
    };

    useEffect(() => {
      const prefetchFile = async () => {
        if (!file.contentType) return;
        setLoading(true);
        const localFile = await fetchFile(fileId, file.contentType);
        setLoading(false);
        if (localFile) {
          setBlob(localFile);
        }
      };
      if (!blob) {
        prefetchFile();
      }
    }, [blob, file.contentType, fileId]);

    return (
      <Pressable onPress={blob ? async (_) => await openDocument() : downloadAndOpen}>
        <View
          style={{
            width: 150,
            flexDirection: 'row',
            padding: 12,
          }}
        >
          <Pdf />
          <View
            style={{
              marginLeft: 12,
              flexDirection: 'row',
              flex: 1,
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontSize: 16,
              }}
            >
              {getPayloadSize(file.bytesWritten || 0)}
            </Text>
            {!blob && !loading && <Download />}
            {loading && <ActivityIndicator />}
          </View>
        </View>
      </Pressable>
    );
  }
);
