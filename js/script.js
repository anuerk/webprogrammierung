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

  fetch(auth_api_url, {
    credentials: "include",
    mode: "cors",
  })
    .then(function (resp) {
      if (resp.status == 401) {
        console.log("401")
        return resp.json()
      }
      else {
        console.log("you are in")
        get_rooms(false)
        get_users()
      }
    })
    .then((json) => {
      //todo wird auch aufgerufen, wenn schon angemeldet
      login_visible(json.verification_uri, json.user_code)
    })
    .catch((error) => {
      console.log('delete cooie')
      document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      console.log(error)
    });
}

function login_visible(url, code) {
  document.getElementById("overlay").style.display = "block"

  var tmpStr = document.getElementById('text').innerHTML
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
        btn.addEventListener("click", enter_room)

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
    enter_room(true);
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
      var ul = document.createElement('ul')

      for (let user of data) {
        let li = document.createElement("li")
        li.innerHTML = user

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
function enter_room(create_new_room) {
  let fetch_rooms_url = get_rooms_api_url
  let enter_fetch_url = ""

  // need for difference url room name
  let room = this.value

  if (create_new_room === true) {
    enter_fetch_url = join_room_api_url + document.getElementById('new_room').value + '/users'
  } else {
    enter_fetch_url = join_room_api_url + room + '/users'
  }
  console.log('enter_fetch_url' + enter_fetch_url)

  let delete_fetch_url = delete_room_api_url + localStorage.getItem("current_room") + '/users'

  //todo braucht man doch eigentlich kein local storage
  if (localStorage.getItem("current_room") == room) {
    alert("You are already in the room " + room)
  }
  else {
    // leave current room todo evtl. auslafgern als funktion
    console.log('1 raum verlassen')
    console.log(delete_fetch_url)
    fetch(delete_fetch_url, {
      method: 'delete',
      credentials: "include",
    })
      .then(function (resp) {

        console.log(resp.status)
        if (resp.status = 404) {
          alert("1 You are not in the room " + room)
        }

        else if (resp.status = 200) {
          alert("1 jaaaa You left  the room " + document.getElementById('new_room').value)
        }

        // mark the current a tctive room
        //debugger 'todo
        //document.getElementsByClassName(room).className = 'active_room'

        console.log('2 raum betreten')
        console.log(enter_fetch_url)
        // enter new room
        fetch(enter_fetch_url, {
          method: 'POST',
          credentials: "include",
        })
          .then(function (resp) {
            localStorage.setItem("current_room", room)

            if (resp.status = 200) {
              alert("2 you joined the room " + room)
              //todo read "old" messages
              read_old_messages(room)

            } else if (resp.status = 201) {
              alert("2 You created and joinend in the room " + room)

            }
            else if (resp.status = 404) {
              alert("2 You are not in the room " + room)
            }

            return
          })
          .catch(function (error) {
            console.log(error)
          });
        return
      })
      .catch(function (error) {
        console.log(error)
      });
  }
}

function send_message_in_room() {
  console.log('send_message')
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

function read_old_messages(room){
  document.getElementById('chat_history').innerHTML = ''
  console.log('muss noch gemacht werden')

  let fetch_rooms_messages = get_message_for_room_api_url + room + "/messages"
  let enter_fetch_url = ""

  fetch(fetch_rooms_messages, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      // todo schöner machen
      var ul = document.createElement('ul')

      for (let message of data) {
        console.log('message')
        console.log(message)
        let li = document.createElement("li")
        li.innerHTML = message.user + ': ' + message.message

        ul.appendChild(li)
      }

      document.getElementById('chat_history').append(ul)
      return
    })
    .catch(function (error) {
      console.log(error)
    });
}

// Create socket
socket = new WebSocket("wss://chatty.1337.cx/rooms/foo/users");

// Log socket opening and closing
socket.addEventListener("open", event => {
  console.log("Websocket connection opened");
});
socket.addEventListener("close", event => {
  console.log("Websocket connection closed");
});

// Handle the message
socket.addEventListener("message", event => {
  if (event.data instanceof Blob) {
    reader = new FileReader();

    reader.onload = () => {
      console.log("Result: " + reader.result);
    };

    reader.readAsText(event.data);
  } else {
    console.log("Result: " + event.data);
  }
})

/*
socket.onopen = function(e) {
  alert("[open] Connection established");
  alert("Sending to server");
  //socket.send("My name is John");
};
/*
socket.onmessage = function(event) {
  alert(`[message] Data received from server: ${event.data}`);
};

socket.onclose = function(event) {
  if (event.wasClean) {
    alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    alert('[close] Connection died');
  }
};

socket.onerror = function(error) {
  alert(`[error] ${error.message}`);
};*/