import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import base64 from "react-native-base64";
import { BleManager, Device } from "react-native-ble-plx";

type Status = 'initial' | 'scanning' | 'connecting' | 'connected' | 'timeout'

interface BluetoothLowEnergyApi {
  requestBluetoothPermission(): Promise<boolean>;
  scanAndConnect(): void;
  disconnectFromDevice: () => void;
  sendCommand: (command: string) => void;
  connectedDevice: Device | null;
  allDevices: Device[];
  manager: BleManager;
  status : Status;
}

function useBLE(): BluetoothLowEnergyApi {
  const bleManager = useMemo(() => new BleManager(), []);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<Status>('initial')


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


  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;
  
  function scanAndConnect(){
    const timeout = setTimeout(() => {
      bleManager.stopDeviceScan()
      setStatus('timeout')
    },8000)

    setStatus('scanning')
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Device scan error: ', error);
      }
      if (device) {
        if(device.name === 'Yaratik'){
          setStatus('connecting')
          clearTimeout(timeout)
          bleManager.stopDeviceScan()
          device.connect()
            .then(() => {
              setConnectedDevice(device)
              setStatus('connected')
              device.discoverAllServicesAndCharacteristics()
                .catch(error => console.log('Sevice discovery error: ', error))
            })
            .catch((error) => {console.log('Not connected !!! ', error)})
          console.log('found')
        } 
        else{
          if(device.name){
            setAllDevices((prevState: Device[]) => {
            if (!isDuplicteDevice(prevState, device)) {
              return [...prevState, device];
            }
            return prevState;
            });
          }
        }
      }
    })};

    function disconnectFromDevice(){
      if (connectedDevice) {
        bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
      }
    };

    function sendCommand(command:string) {

      if(connectedDevice){
        connectedDevice.writeCharacteristicWithoutResponseForService(
          "4fafc201-1fb5-459e-8fcc-c5c9c331914b",
          "6d68efe5-04b6-4a85-abc4-c2670b7bf7fd",
          base64.encode(command)
        ).catch(error => console.log('Write error: ', error))
      }
    }
  
  return {
    scanAndConnect,
    requestBluetoothPermission,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    manager: bleManager,
    sendCommand,
    status
  };
}

export default useBLE;