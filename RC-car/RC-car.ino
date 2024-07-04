#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>

// BLE SECTION
BLEServer *pServer = NULL;

BLECharacteristic *message_characteristic = NULL;

// See the following for generating UUIDs:
// https://www.uuidgenerator.net/

#define SERVICE_UUID "4fafc201-1fb5-459e-8fcc-c5c9c331914b"

#define MESSAGE_CHARACTERISTIC_UUID "6d68efe5-04b6-4a85-abc4-c2670b7bf7fd"

int motor1Pin1 = 12;
int motor1Pin2 = 13;
int enable1Pin = 5;

int motor2Pin1 = 14; 
int motor2Pin2 = 27; 
int enable2Pin = 16;

// Setting PWM properties
const int freq = 30000;
const int resolution = 8;

int throttle, steering;

int speed[4] = {0, 160, 205, 255};

bool isConnected = false;
bool isLedOn = false;
unsigned long ledTime;


class MyServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer)
  {
    isConnected = true;
    isLedOn = true;
    digitalWrite(LED_BUILTIN, HIGH);
    Serial.println("Connected");
  };

  void onDisconnect(BLEServer *pServer)
  {
    isConnected = false;
    digitalWrite(motor1Pin1, LOW);
    digitalWrite(motor1Pin2, LOW);
    digitalWrite(motor2Pin1, LOW);
    digitalWrite(motor2Pin2, LOW);
    ledcWrite(enable1Pin, 0);
    ledcWrite(enable2Pin, 0);
    Serial.println("Disconnected");
    pServer->getAdvertising()->start();
  }
};

class CharacteristicsCallbacks : public BLECharacteristicCallbacks
{
  void onWrite(BLECharacteristic *pCharacteristic)
  {
    Serial.print("Value Written ");
    int data = atoi(pCharacteristic->getValue().c_str());
    
    throttle = (data % 7) -3;
    steering = (data / 7) -3;

    int leftIndex, rightIndex;

    if(throttle >= 0){
      leftIndex = throttle + steering;
      rightIndex = throttle - steering;
    }
    else{
      leftIndex = throttle - steering;
      rightIndex = throttle + steering;
    }

    if(leftIndex < 0){
      leftIndex *= -1;
      digitalWrite(motor1Pin1, HIGH);
      digitalWrite(motor1Pin2, LOW);
    }
    else{
      digitalWrite(motor1Pin1, LOW);
      digitalWrite(motor1Pin2, HIGH);
    }
      
    if(rightIndex < 0){
      rightIndex *= -1;
      digitalWrite(motor2Pin2, HIGH);
      digitalWrite(motor2Pin1, LOW);
    }
    else{
      digitalWrite(motor2Pin2, LOW);
      digitalWrite(motor2Pin1, HIGH);
    }

    if(leftIndex < 0)
      leftIndex = 0;
    if(leftIndex > 3)
      leftIndex = 3;
    if(rightIndex < 0)
      rightIndex = 0;
    if(rightIndex > 3)
      rightIndex = 3;

    ledcWrite(enable1Pin, speed[leftIndex]);
    ledcWrite(enable2Pin, speed[rightIndex]);

  }
};


void setup()
{
  Serial.begin(115200);

  pinMode(motor1Pin1, OUTPUT);
  pinMode(motor1Pin2, OUTPUT);
  pinMode(enable1Pin, OUTPUT);

  pinMode(motor2Pin1, OUTPUT);
  pinMode(motor2Pin2, OUTPUT);
  pinMode(enable2Pin, OUTPUT);

  ledcAttach(enable1Pin, freq, resolution);
  ledcAttach(enable2Pin, freq, resolution);

  pinMode(LED_BUILTIN, OUTPUT);

  ledTime = millis();

  // Create the BLE Device
  BLEDevice::init("Yaratik");
  // Create the BLE Server
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  // Create the BLE Service
  BLEService *pService = pServer->createService(SERVICE_UUID);
  delay(100);

  // Create a BLE Characteristic
  message_characteristic = pService->createCharacteristic(
      MESSAGE_CHARACTERISTIC_UUID,
      BLECharacteristic::PROPERTY_READ |
          BLECharacteristic::PROPERTY_WRITE |
          BLECharacteristic::PROPERTY_NOTIFY |
          BLECharacteristic::PROPERTY_INDICATE);

  // Start the BLE service
  pService->start();

  // Start advertising
  pServer->getAdvertising()->start();

  message_characteristic->setValue("Message one");
  message_characteristic->setCallbacks(new CharacteristicsCallbacks());

  Serial.println("Waiting for a client connection to notify...");
}

void loop()
{
  if(!isConnected && millis() - ledTime > 1000){

    if(isLedOn){
      digitalWrite(LED_BUILTIN, LOW);
      isLedOn = false;
    }
    else{
      digitalWrite(LED_BUILTIN, HIGH);
      isLedOn = true;
    }
    ledTime = millis();
  }

}