var accountInfo = { };
var physName = "";
var endpoint = "";//DEBUG
var patientInfo = { };

console.log("phys_acccount.js loaded");
function sendAccountRequest() {
  $.ajax({
    url: '/phys/account',
    method: 'GET',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json'
  })
    .done(accountInfoSuccess)
    .fail(accountInfoError);
}

function accountInfoSuccess(data, textStatus, jqXHR) {
  physName = data.fullName;
  accountInfo["fullName"] = data.fullName
  $('#email').html(data.email);
  $('#fullName').html(data.fullName);
  $('#lastAccess').html(data.lastAccess);
  $('#main').show();
  sendPatientRequest();

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


function sendPatientRequest(){

  endpoint = '/phys/allPatients?phys='+ physName;

  $.ajax({
    url: endpoint ,
    method: 'GET',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json'
  })
  .done(patientInfoSuccess);

}
function patientInfoSuccess(info, textStatus, jqXHR) {
  
  $("#patients").append("<ul>");
  var i;
for(i=0; i<info.length; i++){
  $("#patients").append("<li>");
  $("#patients").append(info[i]);
  $("#patients").append("</li>");
}

  $("#patients").append("</ul>");

}


$(function() {
  if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
  }
  else {
    sendAccountRequest(); 
  }

 
});