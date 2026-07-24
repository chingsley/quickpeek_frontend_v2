import { useHomeListBottomSpacerStyle } from '@/hooks/useHomeScrollChrome';
import React from 'react';
import Animated from 'react-native-reanimated';

const HomeListBottomSpacer = () => {
  const spacerStyle = useHomeListBottomSpacerStyle();
  return <Animated.View style={spacerStyle} />;
};

export default HomeListBottomSpacer;
