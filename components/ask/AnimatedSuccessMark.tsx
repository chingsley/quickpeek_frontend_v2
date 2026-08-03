import { colors } from '@/constants/colors';
import React, { useEffect } from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SIZE = 80;
const R = 32;
const CX = 40;
const CY = 40;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CHECK_PATH = 'M 24 41 L 36 53 L 58 29';
const CHECK_LENGTH = 50;

type Props = {
  active: boolean;
};

/** Circle outline draws first, then the check mark strokes in on top. */
const AnimatedSuccessMark = ({ active }: Props) => {
  const circleProgress = useSharedValue(0);
  const checkProgress = useSharedValue(0);

  useEffect(() => {
    if (!active) {
      circleProgress.value = 0;
      checkProgress.value = 0;
      return;
    }

    circleProgress.value = withTiming(1, {
      duration: 650,
      easing: Easing.out(Easing.cubic),
    });
    checkProgress.value = withDelay(
      500,
      withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }),
    );
  }, [active, checkProgress, circleProgress]);

  const circleProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - circleProgress.value),
  }));

  const checkProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - checkProgress.value),
  }));

  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} accessibilityLabel="Success">
      <AnimatedCircle
        cx={CX}
        cy={CY}
        r={R}
        stroke={colors.SUCCESS_GREEN}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animatedProps={circleProps}
      />
      <AnimatedPath
        d={CHECK_PATH}
        stroke={colors.SUCCESS_GREEN}
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={CHECK_LENGTH}
        animatedProps={checkProps}
      />
    </Svg>
  );
};

export default AnimatedSuccessMark;
