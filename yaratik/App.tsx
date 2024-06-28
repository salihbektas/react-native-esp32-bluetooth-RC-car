import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { State } from 'react-native-ble-plx'
import ControllerPage from './ControllerPage'
import colors from './colors';
import * as ScreenOrientation from 'expo-screen-orientation';
import useBLE from './useBLE';


export default function App() {

  const {
    manager, 
    scanAndConnect, 
    requestBluetoothPermission, 
    connectedDevice, 
    allDevices, 
    sendCommand,
    disconnectFromDevice
  } = useBLE()

  


  useEffect(() => {
    (async() => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      await requestBluetoothPermission()
      const subscription = manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          scanAndConnect();
          subscription.remove();
        }
      }, true);
   
      const btIsOpened = await manager.state() === State.PoweredOn
      if(!btIsOpened){
        Alert.alert('Bluetooth Must Be On', 'Do you want it to open?', Platform.OS === 'android' ?[
          {
            text: 'Turn On',
            onPress: () => manager.enable().catch(error=> console.log('Try to bt turn on ', error))
          }
        ] : [{
          text: 'Ok'
        }]);
      }
      else{
        scanAndConnect()
      }

      return () => {
        if(connectedDevice)
          disconnectFromDevice()
      }
    })()

  }, [])

  return (
    <View style={styles.main}>
      <StatusBar style="auto" />
      {
        connectedDevice ? <ControllerPage sendCommand={sendCommand} />
        :<View style={styles.container}><Text>Try to connect Yaratik</Text></View>
      }

    </View>
  );
}

const styles = StyleSheet.create({
  main:{flex:1},

  container: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

});
