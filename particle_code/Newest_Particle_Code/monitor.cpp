//-------------------------------------------------------------------
#include "monitor.h"
#include "heartRate.h"
#include "spo2_algorithm.h"




//-------------------------------------------------------------------

using namespace std;



//-------------------------------------------------------------------



LEDStatus blinkRed(RGB_COLOR_RED, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus blinkBlue(RGB_COLOR_BLUE, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);
LEDStatus blinkGreen(RGB_COLOR_GREEN, LED_PATTERN_BLINK, LED_SPEED_NORMAL, LED_PRIORITY_IMPORTANT);



//-------------------------------------------------------------------
//This code taken from particle tutorial Lab 8

MonitorSM::MonitorSM(MAX30105 &mySensor) : heartSensor(mySensor){
   state = MonitorSM::S_Init;
   beatsPerMinute = 0.0;
   lastBeat = 0;
   sampleReported = false;
}

//-------------------------------------------------------------------
 //default sample period is 6am - 10pm
extern int startTime;
extern int endTime;

//default interval is 30 minutes
extern int interval;
extern String apikey;

bool firstSample = true;
uint32_t irBuffer[100]; //infrared LED sensor data
uint32_t redBuffer[100];  //red LED sensor data
int32_t bufferLength; //data length
int32_t spo2; //SPO2 value
int8_t validSPO2; //indicator to show if the SPO2 calculation is valid
int32_t heartRate; //heart rate value
int8_t validHeartRate; //indicator to show if the heart rate calculation is valid


void MonitorSM::execute() {
   String data = "";
   long irValue = 0;
   float avgBPM = 0.0;
   int32_t avgspo2 = 0;
  // float bpmMeasurement = 0.0;
   
   switch(state){
       
       case MonitorSM::S_Init:{
            tick = 0;
            state = MonitorSM::S_CheckTime;
            initTime = millis();
       break;
       }
       case MonitorSM::S_CheckTime:
       {
           
           //TODO: Add webhook trigger to check time intervals (endtime+starttime)
            if((Time.hour() <= endTime) && (Time.hour() >= startTime)){
                Serial.println("You are within your sample time");
                if(firstSample == true){
                    firstSample = false;
                    Serial.println("Taking first data sample!");
                    state = MonitorSM::S_ReadSensor;
                    initTime = millis();
                }
                else if(((millis()-initTime)/60000) >= interval){//checks to see if interval since last sample has elapsed
                    state = MonitorSM::S_ReadSensor;
                    initTime = millis();
                }
                else{
                   state = MonitorSM::S_CheckTime;
                   Serial.println("Too soon! Interval since last sample has not yet passed!");
                   delay(20000);
                }
                
            }
            else{
                Serial.println("Looks like you are out of time...");//DEBUG
                Serial.println(Time.hour());
                Serial.println("startTime:");
                Serial.println(startTime);
                Serial.println("endTime:");
                Serial.println(endTime);
                state = MonitorSM::S_CheckTime;
                delay(20000);
            }
       break;
       }
       case MonitorSM::S_ReadSensor:{

            blinkBlue.setActive(true);
            
            irValue = heartSensor.getIR();
            
             if (irValue < 5000) {
                 tick++;
                if (tick == 50) {
                     tick = 0;
                    Serial.println("No finger deteced.");
                }
            }
            else if (checkForBeat(irValue) == true)  {
                Serial.println("Finger detected, collecting data!");
                     bufferLength = 100; //buffer length of 100 stores 4 seconds of samples running at 25sps

                  //read the first 100 samples, and determine the signal range
                  for (byte i = 0 ; i < bufferLength ; i++)
                  {
                    while (heartSensor.available() == false) //do we have new data?
                      heartSensor.check(); //Check the sensor for new data
                
                    redBuffer[i] = heartSensor.getRed();
                    irBuffer[i] = heartSensor.getIR();
                    heartSensor.nextSample(); //We're finished with this sample so move to next sample
                
                    Serial.print(F("red="));
                    Serial.print(redBuffer[i], DEC);
                    Serial.print(F(", ir="));
                    Serial.println(irBuffer[i], DEC);
                  }
                
                  //calculate heart rate and SpO2 after first 100 samples (first 4 seconds of samples)
                  maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
                            
            
            bpmHistory.push_back(heartRate);
            spO2History.push_back(spo2);
            
            //to ease the charting of data, some time information 
            hour.push_back(Time.hour());
            minute.push_back(Time.minute());
            date.push_back(Time.day());
            
            
            blinkBlue.setActive(false);
            
                if(WiFi.ready()){
                    state = MonitorSM::S_Report;
                }
                else{
                    state = MonitorSM::S_Record;
                }
            }
            else{
                if(((millis()-initTime)/60000) >= 5){// stop trying to get data after 5 minutes of ng
                     Serial.println("No data uploaded for 5 minutes, back to init");
                     blinkBlue.setActive(false);
                     state = MonitorSM::S_Init;
                }
                else{
                state = MonitorSM::S_ReadSensor;
                }
            }
            
       break;
       }
       case MonitorSM::S_Report:{
           state = MonitorSM::S_Init;
           Serial.println("reporting data, and then clearing it out");
           
           for(unsigned int i = 0; i < bpmHistory.size(); i++){
               avgBPM = bpmHistory.at(i);
               avgspo2 = spO2History.at(i);
               data = String::format("{\"bpm\": \"%f\", \"spO2\": \"%d\",\"hour\": \"%d\",\"minute\": \"%d\",\"date\": \"%d\",\"apikey\":", avgBPM, spo2, hour.at(i), minute.at(i), date.at(i)); 
               data = data + "\"" + apikey + "\"}";
               Serial.println(data);
               
              Particle.publish("heartData", data, PRIVATE); 
           }
         sampleReported = true;
         
         bpmHistory.clear();
         spO2History.clear();
         hour.clear();
         minute.clear();
         date.clear();
           
           
       break;
       }
       case MonitorSM::S_Record:{
           state = MonitorSM::S_Init;
           Serial.println("recording data to report later");
       break;
       }
       
       
       
   }
   
}

//-------------------------------------------------------------------

float MonitorSM::getBPM() {
   return beatsPerMinute;
}

//-------------------------------------------------------------------

