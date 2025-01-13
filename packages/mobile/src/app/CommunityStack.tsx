import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabStackParamList } from './App';
import { CommunityPage } from '../pages/community/community-page';

export type CommunityStackParamList = {
  Home: {
    typeId?: string;
    tagId?: string;
  };
};

const StackFeed = createNativeStackNavigator<CommunityStackParamList>();
export const CommunityStack = (_props: NativeStackScreenProps<TabStackParamList, 'Community'>) => {
  return (
    <StackFeed.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <StackFeed.Screen name="Home" component={CommunityPage} />
    </StackFeed.Navigator>
  );
};
