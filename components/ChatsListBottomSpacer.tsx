import { useChatsListBottomSpacerStyle } from '@/hooks/useChatsScrollChrome';
import React from 'react';
import Animated from 'react-native-reanimated';

const ChatsListBottomSpacer = () => {
  const spacerStyle = useChatsListBottomSpacerStyle();
  return <Animated.View style={spacerStyle} />;
};

export default ChatsListBottomSpacer;
