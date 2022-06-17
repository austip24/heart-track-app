
void setup() {
  // Subscribe to the integration response event
  Particle.subscribe("hook-response/Create_Data", myHandler, MY_DEVICES);
}

void myHandler(const char *event, const char *data) {
  String output = String::format("Response from Post:\n  %s\n", data);
  // Log to serial console
  Serial.println(output);
}

void loop() {
  // Get some data
  String bpm, spO2, apikey, myTime;
  bpm = "500";
  spO2 = "1000";
  apikey = "GNO4kO0KwgDZ5frrnql6NWyT96yBV6Li";
  myTime = "Right now";
  String data = "{ \"bpm\": \"" + bpm +"\" ,  \"spO2\": \"" + spO2 + 
    "\",  \"apikey\": \"" + apikey + "\",  \"time\": \"" + myTime +"\"}"; 
  Serial.println("Data being sent:");
  Serial.println(data);
  // Trigger the integration
  Particle.publish("Create_Data", data, PRIVATE);
  // Wait 60 seconds
  delay(60000);
}