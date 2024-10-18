import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  clamp,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import colors from '../colors';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useFocusEffect } from 'expo-router';
import useBLE from '../useBLE';

export default function ControllerPage() {
  const [isRotated, setIsRotated] = useState(false);
  const { sendCommand } = useBLE();
  const steeringOffset = useSharedValue<number>(0);
  const throttleOffset = useSharedValue<number>(0);

  const steeringMileStones = useMemo(() => {
    return Array(8)
      .fill(0)
      .map((_, index) => <View style={styles.steeringMilestone} key={index} />);
  }, []);

  const throttleMileStones = useMemo(() => {
    return Array(8)
      .fill(0)
      .map((_, index) => <View style={styles.throttleMilestone} key={index} />);
  }, []);

  const steeringAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: steeringOffset.value }],
  }));

  const throttleAnimatedStyles = useAnimatedStyle(() => ({
    transform: [{ translateY: throttleOffset.value }],
  }));

  const steeringGesture = Gesture.Pan()
    .onChange((event) => {
      steeringOffset.value = clamp(event.translationX, -100, 100);
    })
    .onFinalize(() => {
      steeringOffset.value = withTiming(0, { duration: 100 });
    });

  const throttleGesture = Gesture.Pan()
    .onChange((event) => {
      throttleOffset.value = clamp(event.translationY, -100, 100);
    })
    .onFinalize(() => {
      throttleOffset.value = withTiming(0, { duration: 100 });
    });

  useAnimatedReaction(
    () => {
      let mes;
      if (throttleOffset.value > 88) {
        mes = 0;
      } else if (throttleOffset.value > 50) {
        mes = 1;
      } else if (throttleOffset.value > 17) {
        mes = 2;
      } else if (throttleOffset.value > -17) {
        mes = 3;
      } else if (throttleOffset.value > -50) {
        mes = 4;
      } else if (throttleOffset.value > -88) {
        mes = 5;
      } else {
        mes = 6;
      }

      if (steeringOffset.value > 88) {
        mes += 7 * 6;
      } else if (steeringOffset.value > 50) {
        mes += 7 * 5;
      } else if (steeringOffset.value > 17) {
        mes += 7 * 4;
      } else if (steeringOffset.value > -17) {
        mes += 7 * 3;
      } else if (steeringOffset.value > -50) {
        mes += 7 * 2;
      } else if (steeringOffset.value > -88) {
        mes += 7;
      }

      return mes;
    },
    (result, previous) => {
      if (result !== previous) {
        runOnJS(sendCommand)(String(result));
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      ).then(() => setIsRotated(true));
    }, [])
  );

  if (!isRotated) return null;

  return (
    <View style={styles.main}>
      <Text style={styles.text}> Yaratık</Text>
      <GestureHandlerRootView style={styles.gestureHandler}>
        <View style={styles.steeringContainer}>
          <View style={styles.steeringMilestoneContanier}>
            {steeringMileStones}
          </View>
          <View style={styles.steeringPath} />
          <View style={styles.steeringMilestoneContanier}>
            {steeringMileStones}
          </View>
          <GestureDetector gesture={steeringGesture}>
            <Animated.View style={[styles.circle, steeringAnimatedStyles]} />
          </GestureDetector>
        </View>
        <View style={styles.throttleContainer}>
          <View style={styles.throttleMilestoneContanier}>
            {throttleMileStones}
          </View>
          <View style={styles.throttlePath} />
          <View style={styles.throttleMilestoneContanier}>
            {throttleMileStones}
          </View>
          <GestureDetector gesture={throttleGesture}>
            <Animated.View style={[styles.circle, throttleAnimatedStyles]} />
          </GestureDetector>
        </View>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: colors.white,
    width: '100%',
  },

  text: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.dark,
    marginHorizontal: 'auto',
  },

  gestureHandler: {
    flex: 1,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  circle: {
    height: 80,
    width: 80,
    backgroundColor: colors.sun,
    borderRadius: 40,
    position: 'absolute',
  },

  throttleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 300,
  },

  throttleMilestoneContanier: {
    width: 45,
    height: 200,
    justifyContent: 'space-between',
  },

  throttleMilestone: {
    width: '100%',
    height: 5,
    backgroundColor: colors.sun,
  },

  throttlePath: {
    backgroundColor: colors.water,
    width: 20,
    height: 200,
  },

  steeringContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
  },

  steeringMilestoneContanier: {
    flexDirection: 'row',
    width: 200,
    height: 45,
    justifyContent: 'space-between',
  },

  steeringMilestone: {
    width: 5,
    height: '100%',
    backgroundColor: colors.sun,
  },

  steeringPath: {
    backgroundColor: colors.water,
    width: 200,
    height: 20,
  },
});
