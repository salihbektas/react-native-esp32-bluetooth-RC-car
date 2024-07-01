import { StatusBar } from 'expo-status-bar';
import { Fragment, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
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
    disconnectFromDevice,
    status
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

      return () => {
        if(connectedDevice)
          disconnectFromDevice()
      }
    })()

  }, [])

  return (
    <View style={styles.main}>
      <StatusBar style="auto" />
      { status === 'initial' && <Text style={styles.infoText}> Checking Bluetooth </Text> }
      { status === 'scanning' && <>
        <Text style={styles.infoText}> Looking for Yaratik </Text>
        <ActivityIndicator size={'large'} color={colors.water}/>
        </>
      }
      { status === 'connecting' && <>
        <Text style={styles.infoText}> Try to connect Yaratik </Text>
        <ActivityIndicator size={'large'} color={colors.water}/>
        </>
      }
      { status === 'timeout' && <>
        <Text style={styles.infoText}>Yaratik not found</Text>
        {allDevices.length > 0 && <Text style={styles.auxiliaryText}>Founded devices:</Text> }
        {allDevices.map((device, index) => {
          console.log(device.name)
          if(index !== 0){
            return <Fragment key={index}>
              <View style={styles.seperator} />
              <Text style={styles.deviceNameText}>{device.name}</Text>
            </Fragment>
          }
          return <Text key={index} style={styles.deviceNameText}>{device.name}</Text>
        })}
          <Pressable style={styles.button} onPress={scanAndConnect}>
            <Text style={styles.buttonText}>Scan Again</Text>
          </Pressable>
        </>
      }
      { status === 'failed' && <>
          <Text style={styles.infoText}>Failed to connect to Yaratik</Text>
          <Pressable style={styles.button} onPress={scanAndConnect}>
            <Text style={styles.buttonText}>Connect Again</Text>
          </Pressable>
        </>
      }
      { status === 'connected' && <ControllerPage sendCommand={sendCommand} /> }
    </View>
  );
}

const styles = StyleSheet.create({
  main:{
    flex: 1,
    backgroundColor: colors.white,
    padding: 16
  },

  infoText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 16
  },

  auxiliaryText: {
    fontSize: 25,
    fontWeight: '700',
    color: colors.water,
    marginVertical: 8
  },

  deviceNameText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.dark
  },

  seperator: {
    height: 2,
    backgroundColor: colors.water,
    borderRadius: 1
  },

  button: {
    padding: 8,
    alignItems: 'center',
    marginTop: 'auto',
    backgroundColor: colors.water,
    borderRadius: 4
  },

  buttonText:{
    color: colors.white,
    fontSize: 20,
    fontWeight: '500'
  }

});
