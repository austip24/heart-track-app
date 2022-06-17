function sendRegisterRequest() {
  let email = $('#email').val();
  let password = $('#password').val();
  let fullName = $('#fullName').val();
  let passwordConfirm = $('#passwordConfirm').val();
  let checkPassword = true;
  let errorBlock = document.querySelector("#formErrors");  
  let extraHTML = "<ul>";
  //check for strong password
  // Check to make sure the passwords match
  /////////////////////////Check Strong Password//////////////////////////////
  if(password.length < 10 || password.length > 20){
    extraHTML += "<li>Password must be between 10 and 20 characters.</li>";
    //$('#password').style.border = "2px solid red"
    checkPassword = false;
  }
  
  if(/[a-z]/.exec(password) == null){
    extraHTML += "<li>Password must contain at least one lowercase character.</li>";
    //$('#password').style.border = "2px solid red"
    checkPassword = false;
  }

  if(/[A-Z]/.exec(password) == null){
    extraHTML += "<li>Password must contain at least one uppercase character.</li>";
    //$('#password').style.border = "2px solid red"
    checkPassword = false;
  }

  if(/[0-9]/.exec(password) == null){
    extraHTML += "<li>Password must contain at least one digit.</li>";
    //$('#password').style.border = "2px solid red"
    checkPassword = false;
  }
  if(checkPassword) 
    errorBlock.style.display = "none";
  else {
    errorBlock.innerHTML = extraHTML;
    errorBlock.style.display = "block";
    return;
  }
  /////////////////////////Check Strong Password//////////////////////////////
  /////////////////////////Check DeviceID//////////////////////////////
  // if(!deviceId){
  //   $('#ServerResponse').html("<span class='red-text text-darken-2'>Need a Device ID.</span>");
  //   $('#ServerResponse').show();
  //   return;
  // }
  /////////////////////////Check DeviceID//////////////////////////////
  if (password != passwordConfirm) {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Passwords do not match.</span>");
    $('#ServerResponse').show();
    return;
  }
  
  $.ajax({
    url: '/phys/register',
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({email:email, fullName:fullName, password:password}),
    dataType: 'json'
  })
    .done(registerSuccess)
    .fail(registerError);
}

function registerSuccess(data, textStatus, jqXHR) {
  if (data.success) {  
    window.location = "phys_signin.html";
  }
  else {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " + data.message + "</span>");
    $('#ServerResponse').show();
  }
}

function registerError(jqXHR, textStatus, errorThrown) {
  if (jqXHR.statusCode == 404) {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Server could not be reached.</p>");
    $('#ServerResponse').show();
  }
  else {
    $('#ServerResponse').html("<span class='red-text text-darken-2'>Error: " + jqXHR.responseJSON.message + "</span>");
    $('#ServerResponse').show();
  }
}

$(function () {
  $('#signup').click(sendRegisterRequest);
});
