function getWeeklySummary() {
  $.ajax({
    url: '/users/weeklySummary',
    method: 'GET',
    headers: { 'x-auth': window.localStorage.getItem("authToken") },  
    contentType: 'application/json',
    dataType: 'json'
   })
   .done(function (data, textStatus, jqXHR){
     displaySummary(data);
   })
   .fail(function(jqXHR, textStatus, errorThrown) {
     $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
     $("#error").show();
   });
}

function displaySummary(data) {
  console.log(data);
  let weeklyData = $("#weeklyData");
  let nextElement = "";
  for (let i = 0; i < data.length; i++) {
    let currItem = JSON.parse(data[i]);
    nextElement += "<li class='collection-item'>";
    nextElement += "<ul class='collection with-header'>";
    nextElement += "<li class='collection-header'><b>Device ID</b>: " + currItem.deviceID + "</li>";
    if (currItem.hasOwnProperty("message")) {
      weekly.append("<li class='collection-item'>" + currItem.message + "</li>");
    }
    else {
    nextElement += "<li class='collection-item'><b>Average Heart Rate:</b> " + currItem.avg + "</li>";
    nextElement += "<li class='collection-item'><b>Maximum Heart Rate:</b> " + currItem.max + "</li>";
    nextElement += "<li class='collection-item'><b>Minimum Heart Rate:</b> " + currItem.min + "</li>";
    nextElement += "</ul></li>";
    weeklyData.append(nextElement);
    nextElement = "";
    }
  }
}

$(function() {
  getWeeklySummary();
});