import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import { BleManager, Device } from 'react-native-ble-plx'
import base64 from 'react-native-base64'


type Status = 'Scanning' | 'Connecting' | 'Connected'

const manager = new BleManager()

export default function App() {
  const [status, setStatus] = useState<Status>('Scanning')
  const [device, setDevice] = useState<Device | null>(null)


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
            return device.discoverAllServicesAndCharacteristics()
              .then(() => {setStatus('Connected');})
              .catch(error => console.log('Sevice discovery error: ', error))
          })
          .catch(() => {console.log('Not connected !!!')})
        console.log('founded')
        // Proceed with connection.
      }
    })
  }

  useEffect(() => {
    (async() => {
      await requestBluetoothPermission()
    })()

    setStatus('Scanning')
    scanAndConnect()
  }, [])

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {status === 'Scanning' ? <Text>Scanning</Text> : 
       status === 'Connecting' ? <Text>Try to connect Yaratik</Text>:
       status === 'Connected' ? <Text>Connected</Text>: 
       null
      }
      <Button title='Send Data' onPress={() => {
        if(device){
          device.writeCharacteristicWithoutResponseForService(
            "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
            "beb5483e-36e1-4688-b7f5-ea07361b26a8",
            base64.encode('test')
          ).catch(error => console.log(error))
        }
      }} />
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
