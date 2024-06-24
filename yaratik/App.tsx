import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, PermissionsAndroid, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx'
import base64 from 'react-native-base64'
import ControllerPage from './ControllerPage'
import colors from './colors';
import * as ScreenOrientation from 'expo-screen-orientation';


type Status = 'Scanning' | 'Connecting' | 'Connected'

const manager = new BleManager()

export default function App() {
  const [status, setStatus] = useState<Status>('Scanning')
  const [device, setDevice] = useState<Device | null>(null)

  function sendCommand(command:string) {

    if(device){
      device.writeCharacteristicWithoutResponseForService(
        "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
        "6d68efe5-04b6-4a85-abc4-c2670b7bf7fd",
        base64.encode(command)
      ).catch(error => console.log(error))
    }
  }


  const requestBluetoothPermission = async () => {
    if (Platform.OS === 'ios') {
      return true
    }
    if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
      const apiLevel = parseInt(Platform.Version.toString(), 10)
  
      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        return granted === PermissionsAndroid.RESULTS.GRANTED
      }
      if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
        ])
  
        return (
          result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
        )
      }
    }
  
    console.log('Permission have not been granted')
  
    return false
  }
  
  function scanAndConnect() {
    manager.startDeviceScan(null, null, (error, device) => {
      if (error || !device) {
        console.log('scan error: ', error)
        return
      }
  
      // Check if it is a device you are looking for based on advertisement data
      // or other criteria.
      
      if (device.name === 'Yaratik') {

        
        // Stop scanning as it's not necessary if you are scanning for one device.
        manager.stopDeviceScan()
        setStatus('Connecting')
        device.connect()
          .then(() => {
            setDevice(device)
            device.discoverAllServicesAndCharacteristics()
              .then(() => {setStatus('Connected');})
              .catch(error => console.log('Sevice discovery error: ', error))
          })
          .catch(() => {console.log('Not connected !!!')})
        console.log('found')
        // Proceed with connection.
      }
    })
  }

  useEffect(() => {
    (async() => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      await requestBluetoothPermission()
    })()

    setStatus('Scanning')
    scanAndConnect()
  }, [])

  return (
    <View style={styles.main}>
      <StatusBar style="auto" />
      {status === 'Scanning' ? <View style={styles.container}><Text>Scanning</Text></View> : 
      status === 'Connecting' ? <View style={styles.container}><Text>Try to connect Yaratik</Text></View>:
      status === 'Connected' ? 
      <ControllerPage sendCommand={sendCommand} />: 
      null
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
