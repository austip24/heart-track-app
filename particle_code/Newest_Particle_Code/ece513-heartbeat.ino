// This #include statement was automatically added by the Particle IDE.
//#include <SparkFun-MAX3010x.h>

// This #include statement was automatically added by the Particle IDE.
#include <MAX30105.h>

// This #include statement was automatically added by the Particle IDE.
//#include <SparkFun-MAX3010x.h>

//access token!
//6512c3accdbb0b797a658980e30c8a25cbcd3c11
/*
This code is a shmorgishborg of repurposed example code from the SparkFun-MAX3010x library, and the eceServer example code
All other authors have authorized the use of this code for this project. This project seeks to redefine the limits of mankind's blood oxygen levels and pulse,
by providing them to a database and a website for viewing and reflecing.
FOR ECE 513 PROJECT "HeartTrack"
by
Charles Penny
Austin Pierson
Miguel Angel Castro Gonzalez 
*/

// This #include statement was automatically added by the Particle IDE.


#include <Wire.h>
#include "monitor.h"
#include <iostream> 
#include <sstream> 

//-------------------------------------------------------------------

#define ONE_DAY_MILLIS (24 * 60 * 60 * 1000)
using namespace std;
int tracker = 0;
unsigned long lastSync = millis();
 //default sample period is 6am - 10pm
int startTime = 6; // in hours from UTC
int endTime = 22; // in hours from UTC
//default interval is 30 minutes
unsigned int interval = 30; // in minutes
//for storing api key
String apikey = "";
String timeData = "";
//-------------------------------------------------------------------
//Cloud API functions
int timeChange(String timeSet);

//-------------------------------------------------------------------
// Sensors and Outputs

//Variables and objects
MAX30105 heartSensor = MAX30105();

//-------------------------------------------------------------------

// State Machines

MonitorSM monSM (heartSensor);

//-------------------------------------------------------------------

// State machine scheduler

bool executeStateMachines = false;

void simpleScheduler() {
   executeStateMachines = true;
}

Timer schedulerTimer(10, simpleScheduler);

//-------------------------------------------------------------------

void setup(){
    delay(3000);
    
    Serial.begin(115200);
    Serial.println("OPERATION HEART TRACK INITIALIZED, PLEASE DO NOT PANIC");
    
    
    // Sensor Initialization:  default I2C port, 400kHz speed
    
   if (!heartSensor.begin(Wire, I2C_SPEED_FAST)) {
      Serial.println("MAX30105 was not found. Please check wiring/power.");
      while (1);
   }
   
   
   
    // Configure sensor with default settings
   heartSensor.setup(); 
   
  
   // Turn Red LED to low to indicate sensor is running
   heartSensor.setPulseAmplitudeRed(0x0A);
  
   // Turn off Green LED
   heartSensor.setPulseAmplitudeGreen(0); 
   
  byte ledBrightness = 60; //Options: 0=Off to 255=50mA
  byte sampleAverage = 4; //Options: 1, 2, 4, 8, 16, 32
  byte ledMode = 2; //Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
  byte sampleRate = 100; //Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
  int pulseWidth = 411; //Options: 69, 118, 215, 411
  int adcRange = 4096; //Options: 2048, 4096, 8192, 16384

  heartSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange); //Configure sensor with these settings
  
   // Starts the state machine scheduler timer.
   schedulerTimer.start();
   
   
   // Setup webhook subscribe
    Particle.subscribe("hook-response/heartData", myHandler, MY_DEVICES);
    
    Particle.subscribe("hook-response/byID", apiHandler, MY_DEVICES);
    
   
    
    delay(3000);//3 second delay before getting apikey
    
    Particle.publish("byID", apikey, PRIVATE);
    
    
    
    
}
//-------------------------------------------------------------------
void loop() {
   // Request time synchronization from the Particle Cloud once per day
   if (millis() - lastSync > ONE_DAY_MILLIS) {
      Particle.syncTime();
      lastSync = millis();
   }

   if (executeStateMachines) {
      monSM.execute();
   }
   
   if(tracker < 10000){
      tracker = 0;
      Particle.publish("byID", apikey, PRIVATE);//update time info
      Serial.println("GET request to update any changes to time range paremeters");
   }
   else{
       tracker++;
   }
}

//-------------------------------------------------------------------

// When obtain response from the publish
void myHandler(const char *event, const char *data) {
  // Formatting output
  String output = String::format("Response from Post:\n  %s\n", data);
  // Log to serial console
  Serial.println(output);
}
void apiHandler(const char *event, const char *data){//handles apikey information sent from web app
   
        Serial.println(data);
        stringstream ss;
        ss << data;
        ss >> apikey >> startTime >> endTime >> interval;
        //format byID as "apikey startTime endTime interval
        
   }
   

