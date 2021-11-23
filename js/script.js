document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"
const get_users_api_url = "https://chatty.1337.cx/users"

function do_auth() {
  /*
    checks the authentication
  */

  fetch(auth_api_url, {
    credentials: "include",
    mode: "cors",
  })
    .then((res) => {
      console.log(res);
      return res.json();
    })
    .catch((error) => {
      console.log('delete cooie')
      document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      console.log(error)
    });
}
/*
function get_rooms() {


  fetch(get_rooms_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('daaaaata')
      console.log(data)
      let rooms = data

      let li = document.createElement("li");

      document.getElementById('rooms').append(li)
      return
    })
    .catch(function (error) {
      console.log(error);
    });
}*/

function get_rooms() {

  let temp = call_rooms()
  console.log('temp')
  console.log(temp)

}

async function call_rooms() {

  const results = await fetch(get_rooms_api_url, {
    credentials: "include",
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    }
  })

  return results.json()

}

function get_users() {


  fetch(get_users_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('da')
      console.log(data)

      var ul = document.createElement('ul');
      ul.setAttribute('id', 'proList');

      for (let user of data) {
        console.log('in for')
        let li = document.createElement("li");
        li.innerHTML = li.innerHTML + element
        
        ul.appendChild(li)
      }

      document.getElementById('users').append(ul)
      return
    })
    .catch(function (error) {
      console.log(error);
    });
}
/*function get_users() {

  let temp = call_users()
  console.log('temp')
  console.log(temp)
}

async function call_users() {

  const results = await fetch(get_users_api_url, {
    credentials: "include",
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    }
  })

  return results.json()

}*/

function addElement(id) {
  // erstelle ein neues div Element
  // und gib ihm etwas Inhalt
  var newDiv = document.createElement("div");
  var newContent = document.createTextNode("Hi there and greetings!");
  newDiv.appendChild(newContent); // füge den Textknoten zum neu erstellten div hinzu.

  // füge das neu erstellte Element und seinen Inhalt ins DOM ein
  var currentDiv = document.getElementById(id);
  document.body.insertBefore(newDiv, currentDiv);
}