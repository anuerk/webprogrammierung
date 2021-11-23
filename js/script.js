document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"
const get_users_api_url = "https://chatty.1337.cx/users"
const join_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/users

const label_users = "users"
const label_rooms = "rooms"

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

function get_rooms() {
  document.getElementById('rooms').innerHTML = label_rooms;

  fetch(get_rooms_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('da')
      console.log(data)

      var ul = document.createElement('ul');

      for (let room of data) {
        console.log('in for')
        let li = document.createElement("li");

        let btn = document.createElement("button")
        btn.innerHTML = room
        btn.value = room
        //todo net nur klick
        btn.addEventListener("click", enter_room)

        li.appendChild(btn)
        ul.appendChild(li)
      }
      console.log("ul")
      console.log(ul)
      document.getElementById('rooms').append(ul)
      return
    })
    .catch(function (error) {
      console.log(error);
    });

}

function get_users() {
  document.getElementById('users').innerHTML = label_users;

  fetch(get_users_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('get_users')
      console.log(data)

      var ul = document.createElement('ul');

      for (let user of data) {
        console.log('in for')
        let li = document.createElement("li");
        li.innerHTML = user

        ul.appendChild(li)
      }

      document.getElementById('users').append(ul)
      return
    })
    .catch(function (error) {
      console.log(error);
    });
}

function enter_room() {
  console.log('enter room')

  // todo fetch blabla
  let room = this.value
  let fetch_url = join_room_api_url + room + '/users'
  console.log(join_room_api_url + room + '/users')

  fetch(fetch_url, {
    method: 'POST',
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('get_users')
      /* todo
      - option für neuen raum (über "+" icon neben "rooms")
   - popup info (erstmal) für jeweiligen response header   
 Code	Description	Links
 200	
 You joined the room
 
 No links
 201	
 You created and joined the room
 
 No links
 409	
 You are already in the room
 
 */
      return
    })
    .catch(function (error) {
      console.log(error);
    });
}

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