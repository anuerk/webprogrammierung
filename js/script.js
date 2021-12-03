/*

ok GET ​/rooms List all rooms
GET ​/rooms​/{room}​/users List members in room
ok POST ​/rooms​/{room}​/users Join room
PATCH ​/rooms​/{room}​/users Receive new joins and leaves through websocket (wss://...)
ok DELETE ​/rooms​/{room}​/users Leave the room
GET ​/rooms​/{room}​/messages List messages in room
ok POST ​/rooms​/{room}​/messages Send a message to the room
PATCH ​/rooms​/{room}​/messages Receive new messages through websocket (wss://...)

users
GET ​/users List all users
GET ​/users​/{user}​/rooms List rooms the user is in
POST ​/users​/{user}​/messages Send a message to the user 

me
GET ​/me​/device_code initiates the GitHub device code authentication flow
PATCH ​/me​/messages Receive new messages through websocket (wss://...)

*/

document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"
const get_users_api_url = "https://chatty.1337.cx/users"
const join_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/users
const delete_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/users
const send_message_api_url = "https://chatty.1337.cx/rooms/" //{room_name/messages
const get_message_for_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/messages

const label_users = "users"
const label_rooms = "rooms"
const label_add = "add"

function init() {

  console.log('init')

  fetch(auth_api_url, {
    credentials: "include",
    mode: "cors",
  })
    .then(function (resp) {
      if (resp.status == 401) {
        return resp.json()
      }
      else {
        get_rooms()
        enter_chat(false, true)
        get_users()
        return resp.json()
      }
    })
    .then((json) => {
      if (json.hasOwnProperty('verification_uri')) {
        login_visible(json.verification_uri, json.user_code)
      }
    })
    .catch((error) => {
      //todo console.log('delete cooie')
      document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      console.log(error)
    });
}

function login_visible(url, code) {
  document.getElementById("overlay").style.display = "block"

  let tmpStr = document.getElementById('text').innerHTML
  document.getElementById("text").innerHTML = "Please login fist <a href='" + url + "' target='blank'>here</a> <br/>" + "with code <br/><b>" + code + "</b>" + tmpStr
}

function login_hide(url, code) {
  document.getElementById("overlay").style.display = "none";
  get_rooms()
  get_users()
}

function get_rooms() {
  /*
  baut gerade den inhalt des kompletten rooms divs auf
  todo macht zu viel
  */

  document.getElementById('rooms').innerHTML = '<h2>' + label_rooms + '</h2>'
  let ul = document.createElement('ul')

  fetch(get_rooms_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      for (let room of data) {
        let li = document.createElement("li")
        let btn = document.createElement("button")
        btn.innerHTML = room
        btn.value = room
        btn.classList.add(room);
        //todo net nur klick
        btn.addEventListener("click", enter_chat)

        li.appendChild(btn)
        ul.appendChild(li)
      }
      return
    })
    .catch(function (error) {
      console.log(error)
    })

  let li = document.createElement("li")
  let btn = document.createElement("button")
  btn.innerHTML = label_add
  btn.value = label_add
  //todo net nur klick
  btn.addEventListener('click', function (event) {
    enter_chat(true);
  });
  btn.classList.add("fas", "fa-plus")


  // todo passt hier nicht hin
  // create text input to create new room
  let hr = document.createElement('hr');
  let input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('name', 'new_room');
  input.setAttribute('id', 'new_room');


  li.appendChild(input)
  li.appendChild(btn)
  li.appendChild(hr)
  ul.appendChild(li)

  document.getElementById('rooms').append(ul)
}

function get_users() {
  document.getElementById('users').innerHTML = '<h2>' + label_users + '</h2>'

  fetch(get_users_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      let ul = document.createElement('ul')

      for (let user of data) {
        let li = document.createElement("li")
        let btn = document.createElement("button")
        btn.innerHTML = user
        btn.value = user
        btn.classList.add(user);
        //todo net nur klick
        btn.addEventListener("click", enter_chat)

        li.appendChild(btn)
        ul.appendChild(li)
      }

      document.getElementById('users').append(ul)
      return
    })
    .catch(function (error) {
      console.log(error)
    });


}

// wird aufgerufen bei room-button click
function enter_chat(create_new_room, init_call) {
  // todo -> wenn auf user geklickt wurde
  let fetch_rooms_url = get_rooms_api_url
  let enter_fetch_url = ""
  let room = ""

  if (init_call == true) {
    room = localStorage.getItem('current_room')
  } else {
    // need for difference url room name
    room = this.value
  }

  if (create_new_room === true) {
    enter_fetch_url = join_room_api_url + document.getElementById('new_room').value + '/users'
  } else {
    enter_fetch_url = join_room_api_url + room + '/users'
  }

  let delete_fetch_url = delete_room_api_url + localStorage.getItem("current_room") + '/users'

  //todo braucht man doch eigentlich kein local storage
  if (localStorage.getItem("current_room") == room && init_call === false) {
    console.log("You are already in the room " + room)
  }
  else if (init_call === true) {
    read_old_messages(room)
    // update header for current room
    let tmp = document.getElementById('chat_history').innerHTML
    document.getElementById('chat_history').innerHTML = '<h3>' + room + '</h3>' + tmp
  }
  else {
    // leave current room todo evtl. auslafgern als funktion
    fetch(delete_fetch_url, {
      method: 'delete',
      credentials: "include",
    })
      .then(function (resp) {

        // enter new room
        fetch(enter_fetch_url, {
          method: 'POST',
          credentials: "include",
        })
          .then(function (resp) {
            localStorage.setItem("current_room", room)

            if (resp.status = 200) {
              //2 you joined the room " + room
              read_old_messages(room)

            } else if (resp.status = 201) {
              // todo              
              console.log("todo 2 You created and joinend in the room " + room)

            }
            else if (resp.status = 404) {
              // todo?
              console.log("todo 2 You are not in the room " + room)
            }

            // update header for current room
            let tmp = document.getElementById('chat_history').innerHTML
            document.getElementById('chat_history').innerHTML = '<h3>' + room + '</h3>' + tmp

            return
          })
          .catch(function (error) {
            console.log(error)
          });
        return
      })
      .catch(function (error) {
        console.log(error)
      })
  }
}

function send_message_in_room() {
  let send_message_url = delete_room_api_url + localStorage.getItem("current_room") + '/messages'
  fetch(send_message_url, {
    method: 'POST',
    credentials: "include",
    headers: {
      'Content-Type': 'text/plain',
    },
    body: document.getElementById('chat_input').value
  })
    .then(function (resp) {
      if (resp.status = 409) {
        alert("Message is being broadcast to room " + localStorage.getItem("current_room"))
      } else if (resp.status = 403) {
        alert("You are not a member of the room " + room)
      }
      document.getElementById('chat_input').value = ''
      return
    })
    .catch(function (error) {
      console.log(error)
    });

}

function read_old_messages(room) {
  document.getElementById('chat_history').innerHTML = ''

  let fetch_rooms_messages = get_message_for_room_api_url + room + "/messages"
  let enter_fetch_url = ""

  fetch(fetch_rooms_messages, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      let ul = document.createElement('ul')

      for (let item in data) {
        let li = document.createElement("li")
        li.innerHTML = data[item].user + ': ' + data[item].message
        ul.appendChild(li)
      }

      document.getElementById('chat_history').append(ul)
      return
    })
    .catch(function (error) {
      console.log(error)
    });
}


// Let us open a web socket
const ws = new WebSocket("wss://chatty.1337.cx/me/messages")

ws.onmessage = function (e) {
  var server_message = e.data
  alert('wss reponse :) ' + server_message)
  return false
}

// helper functions
function isJson(str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }
  return true
}
