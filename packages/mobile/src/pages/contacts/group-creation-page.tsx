import { memo, useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Input } from '../../components/ui/Form/Input';
import TextButton from '../../components/ui/Text/Text-Button';
import { GroupAvatar } from '../../components/ui/Avatars/Avatar';
import { Colors } from '../../app/Colors';
import { useDarkMode } from '../../hooks/useDarkMode';
import { Header, HeaderBackButtonProps } from '@react-navigation/elements';
import { ImageSource } from '../../provider/image/RNImageProvider';
import { launchImageLibrary } from 'react-native-image-picker';
import { useConversation } from '../../hooks/chat/useConversation';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NewChatStackParamList } from '../../app/ChatStack';
import { BackButton } from '../../components/ui/Buttons';
import { ContactTile } from '../../components/Contact/Contact-Tile';
import { DotYouProfile } from '@youfoundation/js-lib/network';
import { Text } from '../../components/ui/Text/Text';

type GroupCreationPageProps = NativeStackScreenProps<NewChatStackParamList, 'CreateGroup'>;

export const GroupCreationPage = memo((props: GroupCreationPageProps) => {
  const { recipients } = props.route.params;
  const { navigation } = props;

  const [title, setTitle] = useState<string>('');
  const [asset, setAsset] = useState<ImageSource | undefined>();
  const { mutateAsync: createGroup, status } = useConversation().create;

  const onCreateGroup = useCallback(() => {
    //TODO: Implement this function
  }, []);

  const pickAvatar = useCallback(async () => {
    const image = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    });
    if (image.assets) {
      const pickedImage = image.assets[0];
      const imageSource: ImageSource = {
        uri: pickedImage.uri,
        type: pickedImage.type,
        height: pickedImage.height || 0,
        width: pickedImage.width || 0,
        filename: pickedImage.fileName || '',
        fileSize: pickedImage.fileSize,
      };
      setAsset(imageSource);
    }
  }, []);

  const headerLeft = useCallback(
    (props: HeaderBackButtonProps) => {
      return BackButton({
        onPress: () => navigation.goBack(),
        prop: props,
        label: '',
        style: { marginLeft: 10 },
      });
    },
    [navigation]
  );

  const headerRight = useCallback(() => {
    if (title?.length > 0) {
      return <TextButton title="Save" style={{ marginRight: 8 }} onPress={onCreateGroup} />;
    }
    if (status === 'pending') {
      return <ActivityIndicator size={'small'} style={{ marginRight: 8 }} />;
    }
    return undefined;
  }, [onCreateGroup, status, title?.length]);

  const { isDarkMode } = useDarkMode();
  const headerColor = useMemo(
    () => (isDarkMode ? Colors.slate[900] : Colors.gray[50]),
    [isDarkMode]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DotYouProfile>) => <ContactTile item={item} disabled />,
    []
  );

  return (
    <>
      <Header
        title={'Create Group'}
        headerLeft={headerLeft}
        headerStatusBarHeight={Platform.OS === 'ios' ? 10 : 0}
        headerRight={headerRight}
        headerStyle={{
          backgroundColor: headerColor,
        }}
      />

      <View style={styles.content}>
        <GroupAvatar style={styles.avatar} iconSize={'2xl'} />
        <TextButton title="Edit Avatar" onPress={pickAvatar} />
        <Input
          value={title}
          placeholder="Group Name (required)"
          onChangeText={(title) => setTitle(title)}
          autoCorrect={false}
          autoFocus={true}
          autoCapitalize="sentences"
          style={{
            width: '70%',
          }}
        />
      </View>
      <Text style={{ margin: 16, fontSize: 18, fontWeight: '500' }}>Members</Text>
      <FlatList
        data={recipients}
        keyExtractor={(item) => item.odinId}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </>
  );
});

const styles = StyleSheet.create({
  content: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  avatar: {
    width: 81,
    height: 81,
    borderRadius: 50,
    margin: 16,
    marginRight: 0,
  },
});
