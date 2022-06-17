# Heart_App


Instructions for using the /data POST endpoint

URL: http://ec2-18-218-187-101.us-east-2.compute.amazonaws.com:3000/data/

JSON format (this is sent in the request's body, and is how the particle device sends its POST request): 
{
  "event": "{{{PARTICLE_EVENT_NAME}}}",
  "data": "{{{PARTICLE_EVENT_VALUE}}}",
  "coreid": "{{{PARTICLE_DEVICE_ID}}}",
  "published_at": "{{{PARTICLE_PUBLISHED_AT}}}"
}

The "data" attribute should be formatted like so. Note that the type of "data" value is a string in JSON format (the string is parsed to JSON on the server, so it is very important that the value of "data" is a string!)

"data": "{ "bpm": "72", 
          "spO2": "89.4658",
          "apikey": "GNO4kO0KwgDZ5frrnql6NWyT96yBV6Li"
        }"
        
The above apikey is invalid. Below is a valid apikey that can be used to test the endpoint:

          valid api key: rYoqIdTKtL5OCHiWgdGmoIjlc8P24Oht

Below is a valid value for the "coreid" attribute:

          valid coreid(deviceid): 3e002d000147393033373334

The other two fields, "event" and "published_at", can be whatever the user specifies them to be.

Here is a valid request that can be made to the server:

{

  "event": "POST_DEMO",
  
  "data": "{ "bpm": "50", 
          "spO2": "90",
          "apikey": "rYoqIdTKtL5OCHiWgdGmoIjlc8P24Oht"
        }",
        
  "coreid": "3e002d000147393033373334",
  
  "published_at": "right now"
  
}

The server will respond with one of the following status codes:
  - 500: (internet server error)
  - 400: (bad request)
  - 201: (created)
 
 A 500 status code is sent in the event that the JSON object sent through the POST request failed to be added to the database.
 A 400 status code is sent in the event that the JSON object sent through the POST request is not formatted correctly.
 A 201 status code is sent in the event of a POST success, meaning that a new Data document was added to the database.
 
 The server will also send a JSON formatted response in addition to the aforementioned status codes. The response consists of "status" and "message" attributes. 
 The "status" attribute can be one of two values: "ERROR" or "OK".
 The "status" attribute is "ERROR" if a 500 or 400 status code is sent.
 The "status" attribute is "OK" if a 201 status code is sent.
 
 The "message" attribute provides a description of why the server failed to POST to the database (in the event of a 400 or 500 status code), or a confirmation message saying that the data in the POST request was correctly added to the database (in the event of a 201 status code).
