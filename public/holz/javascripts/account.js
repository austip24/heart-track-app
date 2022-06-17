var accountInfo = { };
var theDevices;

function sendAccountRequest() {
  $.ajax({
    url: '/users/account',
    method: 'GET',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json'
  })
    .done(accountInfoSuccess)
    .fail(accountInfoError);
}

function accountInfoSuccess(data, textStatus, jqXHR) {
  accountInfo["id"] = data.id;
  $('#email').html(data.email);
  $('#fullName').html(data.fullName);
  $('#lastAccess').html(data.lastAccess);
  $('#currentPhysician').html(data.phys);
  $('#main').show();
  theDevices = [];
  getDevices();
  for (let device of theDevices) {
    
    $("#addDeviceForm").before("<li class='collection-item'>ID: " +
      device.deviceId + ", APIKEY: " + device.apikey + 
      "<div>" +
    "<label for='startTimeInput-"+ device.deviceId + "'> Start Time </label>" +
    "<input type='text' id='startTimeInput-"+ device.deviceId +"' name='setTime' value='6'>" +
    "<label for='endTimeInput-"+ device.deviceId + "'> End Time </label>" +
    "<input type='text' id='endTimeInput-"+ device.deviceId +"' name='setTime' value='22'>" +
    "<button id='setTime-" + device.deviceId + "'class='waves-effect waves-light btn' >Set Measurment Time</button> " +
    "<div id='error-" + device.deviceId + "'></div>" +
    "</div>" +
    "<div>" +
    "<label for='hours-"+ device.deviceId + "'> Hours </label>" +
    "<input type='text' id='hours-"+ device.deviceId +"' name='setTime' value='0'>" +
    "<label for='minutes-"+ device.deviceId + "'> Minutes </label>" +
    "<input type='text' id='minutes-"+ device.deviceId +"' name='setTime' value='30'>" +
    "<button id='setFrequency-" + device.deviceId + "'class='waves-effect waves-light btn' >Set Measurment Frequency</button> " +
    "<div id='errorFreq-" + device.deviceId + "'></div>" +
    "</div>" +
     " <button id='ping-" + device.deviceId + "' class='waves-effect waves-light btn'>Ping</button> " +
    "<button id='removeButton-" + device.deviceId + "' class='waves-effect waves-light btn'>Remove</button> " + 
    "<button id='checkDataButton-" + device.deviceId + "' class='waves-effect waves-light btn'>Sensor Data</button> " + 
    " </li>");
    $("#ping-"+device.deviceId).click(function(event) {
      pingDevice(event, device.deviceId);
    });
    $("#removeButton-"+device.deviceId).click(function(event) {
      removeDeviceFromUser(event, device.deviceId);
      removeDevice(event, device.deviceId);
      $(document).ajaxComplete(function() {
        window.location.replace("account.html");
      });
    });
    $("#checkDataButton-"+device.deviceId).click(function(event) {
      $("#error").prepend("<li>" + "Check DATA bUTTON Pressed" + "</li>"); 
      $("#error").show();
      //window.location.replace("data.html?deviceId=" + device.deviceId);
      window.location.replace("data.html?deviceId=" + device.deviceId);
    });
    $("#setTime-"+device.deviceId).click(function(event) {
      $("#error").prepend("<li>" + "Pressed" + "</li>");
      setMeasurmentTime(event, device.deviceId);
      }); 
    $("#setFrequency-"+device.deviceId).click(function(event) {
      $("#error").prepend("<li>" + "Pressed" + "</li>");
      setFrequency(event, device.deviceId);
      }); 
  }
}

function setMeasurmentTime(event, deviceId){
  let endTime = $("#endTimeInput-"+ deviceId).val();
  let startTime = $("#startTimeInput-"+ deviceId).val();
  if(!/^\d+$/.test(startTime) || !/^\d+$/.test(endTime)){
    $("#error-" + deviceId).text("Start or End time is not not a proper number. Please input something intergers");
    return;
  }
  else if(parseInt(endTime) <= parseInt(startTime)){
    $("#error-" + deviceId).text("End Time must be greater than end time (e.g 7AM to 8AM)");
    $("#error").show();
    return;
  }
  else
    $("#error-" + deviceId).text(" ");
  $("#error").prepend("<li>" + startTime + "</li>"); //Debuging line
  $("#error").prepend("<li>" + endTime + "</li>");
  $("#error").show();
  $.ajax({
    url: '/devices/updateTime',
    method: 'PUT',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    contentType: 'application/json',
    data: JSON.stringify({deviceId: deviceId, measureTime: [startTime, endTime]})
  })
  .done(function (data, textStatus, jqXHR) {
    $("#error").prepend("<li>" + "Succesful Time set" + "</li>"); //Debuging line
    $("#error").show();
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    $("#error").prepend("<li>" + textStatus + "</li>");
    $("#error").prepend("<li>" + jqXHR + "</li>");
    $("#error").prepend("<li>" + "Failure Time set" + "</li>"); //Debuging line
    $("#error").show();
  });
}

function setFrequency(event, deviceId){
  let hours = $("#hours-"+ deviceId).val();
  let minutes = $("#minutes-"+ deviceId).val();
  let totalMinutes = parseInt(hours)*60+parseInt(minutes);
  $("#error").prepend("<li>" + hours + "</li>"); //Debuging line
  $("#error").prepend("<li>" + minutes + "</li>");
  $("#error").prepend("<li>" + totalMinutes + "</li>");
  $("#error").show();
  if(!/^\d+$/.test(hours) || !/^\d+$/.test(minutes)){
    $("#errorFreq-" + deviceId).text("Start or End time is not not a proper number. Please input something intergers");
    return;
  }
  else
    $("#error-" + deviceId).text(" ");
   $.ajax({
    url: '/devices/updateFrequency',
    method: 'PUT',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    contentType: 'application/json',
    data: JSON.stringify({deviceId: deviceId, measureFrequency: totalMinutes})
  })
  .done(function (data, textStatus, jqXHR) {
    $("#error").prepend("<li>" + "Succesful Time set" + "</li>"); //Debuging line
    $("#error").show();
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    $("#error").prepend("<li>" + "Failure Time set" + "</li>"); //Debuging line
    $("#error").show();
  });
}


function removeDeviceFromUser(event, deviceId){
  $.ajax({
    url: '/users/removeDevice',
    method: 'PUT',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json',
    data: {deviceId: deviceId, userId: accountInfo["id"]}
  })
  .done(removeDeviceSuccess)
  .fail(removeDeviceError);
}

function removeDevice(event, deviceId){
  $.ajax({
    url: '/devices/remove',
    method: 'POST',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json',
    data: {id: deviceId}
  })
  .done(removeDeviceSuccess)
  .fail(removeDeviceError);
}

// function removeDataFromUser(event, deviceId){
//   $.ajax({
//     url: '/data/remove',
//     method: 'POST',
//     headers: { 'x-auth' : window.localStorage.getItem("authToken") },
//     dataType: 'json',
//     data: {id: deviceId}
//   })
// }

function removeDeviceSuccess(data, textStatus, jqXHR){
  $("#error").prepend("<li>" + "Success" + "</li>"); //Debuging line
  $("#error").show();
}

function removeDeviceError(jqXHR, textStatus, errorThrown){
  $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
  $("#error").show();
}

function getDevices(){
  $.ajax({
    url: '/devices/account',
    method: 'GET',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json',
    async: false
  })
    .done(getDevicesSuccess)
    .fail(getDevicesError);
}

function getDevicesSuccess(data, textStatus, jqXHR){
  $("#error").prepend("<li>" + "Success" + "</li>"); //Debuging line
  $("#error").show();
  for (let device of data.list) {
    theDevices.push(device);
  }
}

function getDevicesError(jqXHR, textStatus, errorThrown){
  $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
  $("#error").show();
  return;
}

function accountInfoError(jqXHR, textStatus, errorThrown) {
  // If authentication error, delete the authToken 
  // redirect user to sign-in page (which is index.html)
  if (jqXHR.status == 401) {
    window.localStorage.removeItem("authToken");
    window.location = "index.html";
  } 
  else {
    $("#error").html("Error: " + jqXHR.status);
    $("#error").show();
  }
}

// Registers the specified device with the server.
function registerDevice() {
  $.ajax({
    url: '/devices/register',
    method: 'POST',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    data: JSON.stringify({ deviceId: $("#deviceId").val()}), 
    dataType: 'json'
   })
  .done(registerDeviceSuccess)
  .fail(registerDeviceError);
}

function registerDeviceSuccess(data, textStatus, jqXHR){
  $("#addDeviceForm").before("<li class='collection-item'>ID: " +
  $("#deviceId").val() + ", APIKEY: " + data["apikey"] + 
    " <button id='ping-" + $("#deviceId").val() + "' class='waves-effect waves-light btn ping'>Ping</button> " +
    "<button id='removeButton-" +  $("#deviceId").val() + "' class='waves-effect waves-light btn'>Remove</button> " + " </li>");
  $("#ping-"+$("#deviceId").val()).click(function(event) {
    pingDevice(event, device.deviceId);
  });
  $("#removeButton-"+$("#deviceId").val()).click(function(event) {
      removeDeviceFromUser(event, $("#deviceId").val());
      removeDevice(event, $("#deviceId").val());
      $(document).ajaxComplete(function() {
        window.location.replace("account.html");
      });
  });
  hideAddDeviceForm(); 
}

function registerDeviceError(jqXHR, textStatus, errorThrown){
  let response = JSON.parse(jqXHR.responseText);
       $("#error").html("Error: " + response.message);
       $("#error").show();
}


function pingDevice(event, deviceId) {
   $.ajax({
        url: '/devices/ping',
        type: 'POST',
        headers: { 'x-auth': window.localStorage.getItem("authToken") },   
        data: { 'deviceId': deviceId }, 
        responseType: 'json',
        success: function (data, textStatus, jqXHR) {
            console.log("Pinged.");
        },
        error: function(jqXHR, textStatus, errorThrown) {
            var response = JSON.parse(jqXHR.responseText);
            $("#error").html("Error: " + response.message);
            $("#error").show();
        }
    }); 
}

// Show add device form and hide the add device button (really a link)
function showAddDeviceForm() {
  $("#deviceId").val("");          // Clear the input for the device ID
  $("#addDeviceControl").hide();   // Hide the add device link
  $("#addDeviceForm").slideDown(); // Show the add device form
}

// Hides the add device form and shows the add device button (link)
function hideAddDeviceForm() {
  $("#addDeviceControl").show();   // Hide the add device link
  $("#addDeviceForm").slideUp();   // Show the add device form
  $("#error").hide();
}

function addDeviceToUser(){
  $.ajax({
    url: '/users/addDevice',
    method: 'PUT',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    data:  JSON.stringify({ 
      deviceID: $("#deviceId").val(),
      userID:accountInfo["id"]}), 
    dataType: 'json'
   })
   .done(function (data, textStatus, jqXHR){
     $("#error").prepend("<li>" + "Success" + "</li>"); //Debuging line
     $("#error").show();
   })
   .fail(function(jqXHR, textStatus, errorThrown) {
     $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
     $("#error").show();
   });
}

function registerADD(){
  registerDevice();
  addDeviceToUser();
}

function getPhysicians() {
$.ajax({
    url: '/phys/',
    method: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    dataType: 'json'
   })
   .done(function (data, textStatus, jqXHR){
     for (let i = 0; i < data.length; i++) {
       $("#physChoice").append("<option value=" + data[i].fullName + "\">" + data[i].fullName + "</option>");
     }
   })
   .fail(function(jqXHR, textStatus, errorThrown) {
     $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
     $("#error").show();
   });
}

function choosePhysician() {
$.ajax({
    url: '/users/choosePhysician',
    method: 'PUT',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    data: JSON.stringify({ 
      phys: $("#physChoice option:selected").text(),
      id: accountInfo["id"]}), 
    dataType: 'json'
   })
   .done(function (data, textStatus, jqXHR){
     console.log(data);
     $("#currentPhysician").text(data.name);
   })
   .fail(function(jqXHR, textStatus, errorThrown) {
     $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
     $("#error").show();
   });
}

$(function() {
  if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
  }
  else {
    sendAccountRequest();
    getPhysicians();
  }

  // Register event listeners
  $("#addDevice").click(showAddDeviceForm);
  $("#registerDevice").click(registerADD);  
  $("#cancel").click(hideAddDeviceForm);
  $("#registerPhysician").click(choosePhysician); 
});