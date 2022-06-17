
//-------------------------------------------------------------------

#ifndef Monitor_H
#define Monitor_H

//-------------------------------------------------------------------


#include <vector>
#include <Wire.h>
#include <time.h>
#include <MAX30105.h>


//-------------------------------------------------------------------

using namespace std;

//-------------------------------------------------------------------

class MonitorSM {
   enum State { S_Init, S_CheckTime, S_ReadSensor, S_Report, S_Record};

private:
   State state;
   long lastBeat;
   int tick;
   float beatsPerMinute;
   MAX30105& heartSensor;
   vector<float> bpmHistory;
   vector<int32_t> spO2History;
   vector<int> hour;
   vector<int> minute;
   vector<int> date;
   bool sampleReported;
   unsigned long initTime;
    
public:
   MonitorSM(MAX30105& mySensor);  
   void execute();
   float getBPM();
   float getspO2();
};

//-------------------------------------------------------------------

#endif
