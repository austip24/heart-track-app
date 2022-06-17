//-------------------------------------------------------------------

#include "BPMmonitor.h"
#include "MAX30105.h"
#include "heartRate.h"
#include <Wire.h>
#include <vector>

//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------
//This code taken from particle tutorial Lab 8

BPMMonitorSM::BPMMonitorSM(MAX30105 &mySensor) : heartSensor(mySensor){
   state = BPMMonitorSM::S_Init;
   beatsPerMinute = 0.0;
   lastBeat = 0;
   sampleReported = false;
}

//-------------------------------------------------------------------

void BPMMonitorSM::execute() {
   String data = "";
   long irValue = 0;
   float avgBPM = 0.0;
   float bpmMeasurement = 0.0;
   
   switch (state) {
      case BPMMonitorSM::S_Init:
         tick = 0;
         state = BPMMonitorSM::S_ReadSensor;
         break;
            
      case BPMMonitorSM::S_ReadSensor:
         irValue = heartSensor.getIR();
         if (irValue < 5000) {
            tick++;
            if (tick == 50) {
               tick = 0;
               Serial.println("No finger deteced.");
            }
         }
         else if (checkForBeat(irValue) == true)  {
            long delta = millis() - lastBeat;
            lastBeat = millis();
                        
            // Adds a random number between 1 and 10 to obfuscate measurement for privacy. 
            bpmMeasurement = 60 / (delta / 1000.0) + random(1, 10);
            if (bpmMeasurement > 30) {
               beatsPerMinute = bpmMeasurement;
               Serial.print("Heart beat detected: ");
               Serial.print(beatsPerMinute);
               Serial.println(" avgBPM");
            
               // Collect 3 samples
               if (bpmHistory.size() < 3) {
                  bpmHistory.push_back(beatsPerMinute);
                  state = BPMMonitorSM::S_ReadSensor;
               }
            }
         }
         
         if (bpmHistory.size() == 3 && !sampleReported) {
            state = BPMMonitorSM::S_Report;
         }
         else {
            state = BPMMonitorSM::S_ReadSensor;
         }
         break;
        
  case BPMMonitorSM::S_Report:
         avgBPM = (bpmHistory.at(0) + bpmHistory.at(1) + bpmHistory.at(2)) / 3.0;
         data = String::format("{ \"avgBPM\": \"%f\" }", avgBPM);          
         Serial.println(data);
         // Publish to webhook
         Particle.publish("BPM", data, PRIVATE);
         sampleReported = true;
         state = BPMMonitorSM::S_ReadSensor;
         break;
   }
}

//-------------------------------------------------------------------

float BPMMonitorSM::getBPM() {
   return beatsPerMinute;
}

//-------------------------------------------------------------------

