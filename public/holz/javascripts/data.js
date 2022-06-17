let queryString = window.location.search;
let urlParams  = new URLSearchParams(queryString);

$("#error").show();
$(function() {
  if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
  }
  else
  {
    updateTitleID();
    getSensorData();
  }
});

function updateTitleID(){
  if (urlParams.has("deviceId")) {
    $("#deviceIDTitle").html(urlParams.get("deviceId"));
  }
  else {
    $("#deviceIDTitle").html("**Device not found**");
  }
}

function getSensorData(){
  if (urlParams.has("deviceId")) {
    // make a request to the server
    let sensorID = urlParams.get("deviceId");
    requestData = {deviceId: sensorID};
    console.log(requestData);
    $("#error").prepend("<li>" + "Requesting data for" + "</li>"); //Debuging line
    $("#error").prepend("<li>" + requestData.deviceId + "</li>");
    $("#error").show();
    $.ajax({
      url: '/data/data',
      method: 'GET',
      data: requestData,
      dataType: 'json'
    })
    .done(function(allMeasurments) {
      google.charts.load('current', {packages: ['corechart', 'line']});
      google.charts.setOnLoadCallback(drawCrosshairs);

      function drawCrosshairs() {
            var data = new google.visualization.DataTable();
            data.addColumn('number', 'X');
            data.addColumn('number', 'BPM');
            data.addColumn('number', 'Oxygen');
            let myData = proccessData(allMeasurments);
            data.addRows(myData);
            var options = {
              hAxis: {
                title: 'Time'
              },
              vAxis: {
                title: 'Popularity'
              },
              colors: ['#a52714', '#097138'],
              crosshair: {
                color: '#000',
                trigger: 'selection'
              }
            };

            var chart = new google.visualization.LineChart(document.getElementById('sensorData'));

            chart.draw(data, options);
            chart.setSelection([{row: 38, column: 1}]);

        }
    })
    .fail(function(data) {
      $("#error").prepend("<li>Failure</li>");
      $("#error").show();
    });
  }
}

function proccessData(allMeasurments){
  let theData = [];
  let min = parseInt(allMeasurments[0].avgBPM);
  let max = parseInt(allMeasurments[0].avgBPM);
  console.log(allMeasurments);
  for (let i = 0; i < allMeasurments.length; i++) {
    if(min > allMeasurments[i].avgBPM)
      min = allMeasurments[i].avgBPM;
    else if (max < allMeasurments[i].avgBPM)
      max = allMeasurments[i].avgBPM;
    //Need to proccess time
    theData.push([parseInt(allMeasurments[i].minute),parseInt(allMeasurments[i].avgBPM), parseInt(allMeasurments[i].spO2)]);
  }
  $("#MAXMIN").text("Maximum BPM:" +  max + "  Minimum BPM:" + min);
  return theData;
}