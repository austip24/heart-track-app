var accountInfo = { };

function updateAccount() {
  console.log(accountInfo['id'])
  let newName = $("#nameinput").val();
  let newPassword = $("#passwordinput").val(); //This need to hashed on back-end
  $("#error").prepend("<li>" + newName + "</li>");
  $.ajax({
    url: '/users/update', 
    method: 'PUT',
    headers: { 'x-auth' : window.localStorage.getItem("authToken") },
    dataType: 'json',
    data: {name: newName, password: newPassword, email: accountInfo["email"], 
    id: accountInfo["id"]}
  }) 
    .done(updateAccountSuccess)
    .fail(updateAccountError);
}

function updateAccountSuccess(data, textStatus, jqXHR) {
  $("#error").prepend("<li>" + "Success" + "</li>"); //Debuging line
  $("#error").show();
}

function updateAccountError(jqXHR, textStatus, errorThrown) {
  if (jqXHR.status >= 400) {
    $("#error").prepend("<li>" + "Failure" + "</li>"); //Debuging line
    $("#error").show();
  }
}


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
  $('#main').show();
  accountInfo["email"] = data.email;
  accountInfo["fullName"] = data.fullName;
  accountInfo["lastAccess"] = data.lastAccess;
  accountInfo["passwordHash"] = data.passwordHash;
  accountInfo["id"] = data.id;
  $("#error").prepend("<li>" + data.id + "</li>"); //Debuging line
  $("#error").show();
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

$(function() {
  if (!window.localStorage.getItem("authToken")) {
    window.location.replace("index.html");
  }
  else {
    sendAccountRequest();
  }
  
  $("#updateButton").click(updateAccount);  
});