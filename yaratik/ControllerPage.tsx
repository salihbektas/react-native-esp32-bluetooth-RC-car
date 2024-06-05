import { useEffect, useState } from 'react';
import {View, Pressable, Text, StyleSheet} from 'react-native';


export default function ControllerPage({sendCommand}:{sendCommand: (param:string)=>void}) {
    

    return(
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
  }
});
