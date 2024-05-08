import { NewPayloadDescriptor, PayloadDescriptor, TargetDrive } from '@youfoundation/js-lib/core';
import { memo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, View } from 'react-native';
import { Pdf } from '../Icons/icons';
import { Text } from '../Text/Text';
import { getPayloadSize } from '../../../utils/utils';
import { useFile } from '../../../hooks/file/useFile';
import ReactNativeBlobUtil from 'react-native-blob-util';

export const BoringFile = memo(
  ({
    odinId,
    targetDrive,
    fileId,
    file,
    canDownload,
  }: {
    odinId: string | undefined;
    targetDrive: TargetDrive;
    fileId: string;
    file: PayloadDescriptor | NewPayloadDescriptor;
    canDownload?: boolean;
  }) => {
    const { fetchFile } = useFile({ targetDrive });
    const [loading, setLoading] = useState(false);
    const downloadAndOpen = async () => {
      setLoading(true);
      const payload = await fetchFile(odinId, fileId, file.key);
      setLoading(false);
      if (!payload) return;
      else {
        console.log('payload', payload);
        if (Platform.OS === 'ios') {
          await ReactNativeBlobUtil.ios.openDocument(payload.uri);
        } else if (Platform.OS === 'android') {
          await ReactNativeBlobUtil.android.actionViewIntent(payload.uri, payload.type);
        }
      }
    };
    return (
      <Pressable onPress={downloadAndOpen}>
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
            {loading && <ActivityIndicator />}
          </View>
        </View>
      </Pressable>
    );
  }
);
