export function GetSessionId (crfToken, username, password){
    const xhr = new XMLHttpRequest();
    xhr.open('POST','/account/login/');
    xhr.setRequestHeader('Content-type','application/x-www-form-urlencoded');
    xhr.onreadystatechange = function()
    {
        window.location.href=this.responseURL;
    }
    const formData = 'csrfmiddlewaretoken='+crfToken+'&username='+username+'&password='+password;
    xhr.send(formData);
}