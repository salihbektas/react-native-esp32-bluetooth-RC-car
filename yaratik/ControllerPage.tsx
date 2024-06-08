import { useEffect, useState } from 'react';
import {View, Pressable, Text, StyleSheet} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';


export default function ControllerPage({sendCommand}:{sendCommand: (param:string)=>void}) {

  const offset = useSharedValue<number>(0);

  const animatedStyles = useAnimatedStyle(() => ({
    transform: [
      { translateX: offset.value },
    ]
  }));

  const pan = Gesture.Pan()
    .onChange((event) => {
      offset.value =  event.translationX > -100 && event.translationX < 100
        ? event.translationX 
        : event.translationX < 0 
          ? -100  
          : 100;
    })
    .onFinalize(() => {
      offset.value = withTiming(0);
    });
    

    return(
      <GestureHandlerRootView style={{flex: 1}}>
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.circle, animatedStyles]} />
        </GestureDetector>
        <View>
          <Pressable onPressIn={() => sendCommand('forward')} onPressOut={() => sendCommand('stop')} >
            <Text style={styles.text}>Forward</Text>
          </Pressable>
          <Pressable onPressIn={() => sendCommand('left')} onPressOut={() => sendCommand('stop')} >
            <Text style={styles.text}>Left</Text>
          </Pressable>
          <Pressable onPressIn={() => sendCommand('right')} onPressOut={() => sendCommand('stop')} >
            <Text style={styles.text}>Right</Text>
          </Pressable>
          <Pressable onPressIn={() => sendCommand('backward')} onPressOut={() => sendCommand('stop')} >
            <Text style={styles.text}>Backward</Text>
          </Pressable>
      </View>
      
    </GestureHandlerRootView>
    )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  text: {
    padding: 10,
    margin: 15,
    borderRadius: 8,
    backgroundColor: 'lightblue'
  },

  circle: {
    height: 80,
    width: 80,
    backgroundColor: '#b58df1',
    borderRadius: 40
  }
});
