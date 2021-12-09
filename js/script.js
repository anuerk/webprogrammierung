/*
here happens the logic for the chat client

- enter room mit leerzeichen 
- file formatierung und ausmisten und ordnen
- create new room error
- ' und "
-- css änderung, wenn neue nachricht von user kommt (neben usernamen) 
- was wenn aber "done" aber gelogen?
- offline
-----------------------------------------------------------------------------


  was hab ich gemacht
  - erstmal protptyp (wie funktioniert was)
  - dann plan, was muss ich alles machen + implementierung des plans
  - annahme: 
      1. user darf nur in einem raum gleichzeitig sein (wäre auch anders gegangen)
      2. es darf keinen raum mit dem namen "" (leer) geben
  - erste überlegungungen für zusatzfunktionen: ba
  - gründe für: 
      1. device flow user wird nicht zurück gegeben (änderung an api)
      2. logged in ist redundant, da ja header entsprechend zurückgegeben wird
  
  - request bei raumwechsel:
          von adsdad
          1. 204 ???
          2. post in neuen raum
          3. hole user in raum
          4. starte alten websocket
          5. verlasse alten raum
          6. lese nachrichten im raum
          7. starte message websocket
          8. starte info websocket
          nach anuerk
  - get users -> auskommentiert, weil ja eigetnlich nutzlo


*/
const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"
const get_users_api_url = "https://chatty.1337.cx/users"
const revieve_user_in_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name}/users
const join_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name}/users
const delete_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/users
const send_message_api_url = "https://chatty.1337.cx/rooms/" //{room_name/messages
const send_message_user_api_url = "https://chatty.1337.cx/users/" //{name}/messages
const get_message_for_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/messages
const leave_room_api_url = "https://chatty.1337.cx/users/" //{user}/rooms
const socket_room_message_api_url = "wss://chatty.1337.cx/rooms/" //{room_name/messages
const socket_room_joins_api_url = "wss://chatty.1337.cx/rooms/" //{user}/rooms

var current_user = ""
var current_chat = ""
let current_room_join_websocket //= new WebSocket()
let current_room_message_websocket //= new WebSocket()
var sockets = []
var labels
var current_view = ""

// checks the browser language and load correct language file
let userLang = navigator.language || navigator.userLanguage;
let url
switch (userLang) {
  case "de":
  case "de-CH":
  case "de-AT":
  case "de-LU":
  case "de-LI":
    url = "./js/lang.de.json"
  default:
    url = "./js/lang.en.json"
}

fetch(url).then(
  function (u) { return u.json(); }
).then(
  function (json) {
    labels = json;
  }
)

async function init() {
  // this is the entry point 
  document.querySelector("#chat_new").style.display = 'none'
  let logged_in = false

  await fetch(auth_api_url, {
    credentials: "include",
    mode: "cors",
  })
    .then(function (resp) {
      //if (resp.status == 401)
      return resp.json()
    })
    .then((json) => {

      if (json.hasOwnProperty("verification_uri")) { //todo or if header is 401?
        display_login(json.verification_uri, json.user_code, false)
        logged_in = false
        localStorage.clear();
      } else {
        // user is logged in - clean up first :)
        current_user = json.user
        logged_in = true
      }
    })
    .catch((error) => {
      console.log(error)
    });

  if (logged_in === true) {
    await leave_all_rooms()
    start_user_message_socket()
    await get_rooms()
    check_old_private_chats()
  }

  return
}

async function get_rooms() {
  // remove existing rooms
  document.getElementById('rooms').innerHTML=''

// get new ones
  let ul = document.createElement('ul')
  let rooms = await fetch(get_rooms_api_url, {
    credentials: "include",
  }).then(response => response.json());

  // and make it "nice"
  for (let room of rooms) {
    let tmp = room.replace(/\s/g, "")

    let li = document.createElement("li")
    let btn = document.createElement("button")

    btn.innerHTML = room
    btn.value = room
    btn.classList.add(tmp);
    btn.addEventListener("click", enter_chat)
    li.appendChild(btn)
    ul.appendChild(li)
  }

  document.getElementById('rooms').append(ul)

}

function display_login(url, code, hide) { // todo tausche true false
  if (hide === true) {
    show_loading(false)
    document.getElementById("overlay").style.display = "none"; //todo z index
    init()
  } else {

    let tmpStr = document.getElementById("login_info").innerHTML
    document.getElementById("login_info").innerHTML = "Please login fist <a href='" + url + "' target='blank'>here</a> <br/>" + "with code <br/><b>" + code + "</b>" + tmpStr
    document.getElementById("overlay").style.display = "block"
    document.getElementById("logged_in").style.display = ""
  }

}

async function leave_all_rooms() {
  // will be called by initial

  await fetch(leave_room_api_url + current_user + '/rooms', {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      for (let key in data) {
        if (data.hasOwnProperty(key)) {
          leave_room(data[key])
        }
      }
      return
    })
    .catch(function (error) {
      console.log(error)
    });
}

async function leave_room(room_name) {
  let delete_fetch_url = delete_room_api_url + room_name + '/users'

  await fetch(delete_fetch_url, {
    method: 'delete',
    credentials: "include",
  })
    .then(function (data) {
      // remove old user list    
      remove_old_user_list(room_name)
      return
    })
    .catch(function (error) {
      console.log(error)
    })
}

function create_user_html(user) {
  let li = document.createElement("li")

  let btn = document.createElement("button")
  btn.innerHTML = user
  btn.value = user
  btn.classList.add(user)
  if (user != current_user) {
    btn.addEventListener('click', function (event) {
      enter_user_chat(user)
    })
  }
  li.appendChild(btn)

  return li
}

// wird aufgerufen bei room-button click
async function enter_chat(create_new_room) {
  console.log('enter_chat')
  document.getElementById('chat_input').value = ''

  // initialize variables
  let enter_fetch_url = ""
  let room = ""

  // need for difference url room name
  room = this.value

  if (current_chat != room || current_view === "user_chat" || create_new_room) {
    console.log('im guten if')
    show_loading(true)

    if (current_chat != "" && current_view == "room") {
      (async () => {
        await leave_room(current_chat)
      })();

    }
    current_view = "room"

    if (create_new_room === true) {
      document.getElementById('new_room').value
      enter_fetch_url = join_room_api_url + document.getElementById('new_room').value + '/users'
      room = document.getElementById('new_room').value
    } else {
      enter_fetch_url = join_room_api_url + room + '/users'
    }
    console.log("enter_fetch_url")
    console.log(enter_fetch_url)
    // enter new room
    await fetch(enter_fetch_url, {
      method: 'POST',
      credentials: "include",
    })
      .then(function (resp) {
        current_chat = room
        console.log(resp.status)

        if (resp.status == 200) {
          // you joined the room 
          update_room_header(room)
          clear_chat_window()
          document.getElementById('chat_history').append(add_chat_window())
          read_old_messages(room)
        } else if (resp.status == 409) {
          console.log('room already exists')
        }
        else if (resp.status == 201) {
          room = document.getElementById('new_room').value
          current_room = document.getElementById('new_room').value
          update_room_header(room)
          clear_chat_window()
          document.getElementById('chat_history').append(add_chat_window())
          console.log('room created')
          get_rooms()
        }

        if (resp.status == 200 || resp.status == 201) {
          if (current_room_join_websocket !== undefined && current_room_join_websocket.readyState === 1) {
            current_room_join_websocket.close()
          }
          if (current_room_message_websocket !== undefined && current_room_message_websocket.readyState === 1) {
            current_room_message_websocket.close()
          }
          current_room_message_websocket = start_room_message_sockets(room)
          current_room_join_websocket = start_room_join_sockets(room)
        }


        get_user_in_rooms(room)
      })
      .catch(function (error) {
        console.log(error)
      });
  } else {
    //already in or created a new one
    //todo enter _chat
    //read_old_messages(room)
    //get_user_in_rooms(room)
    console.log('im doofen else')
  }
  document.querySelector("#chat_new").style.display = ''
}

async function get_user_in_rooms(room_name) {
  console.log('get_user_in_rooms: ' + room_name)
  await fetch(revieve_user_in_room_api_url + room_name + '/users', {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {

      format_users_in_room_html(room_name, data)
      return
    })
    .catch(function (error) {
      console.log(error)
    });

  document.getElementById("chat_history").scrollTop = document.getElementById("chat_history").scrollHeight;
}

function format_users_in_room_html(room_name, user_data) {
  let ul = document.createElement('ul')
  ul.classList.add('user_list_item')
  if (document.getElementById("rooms").getElementsByClassName(room_name)[0] !== undefined) {
    let room_list_item = document.getElementById("rooms").getElementsByClassName(room_name)[0];

    for (let user of user_data) {
      let li = create_user_html(user)
      ul.append(li)
    }
    room_list_item.after(ul)
  } 
  show_loading(false)
}

function send_message() {

  if (document.getElementById('chat_input').value.length === 0) {
    alert(labels.need_message)
  }
  else {
    if (current_view === 'user_chat') {
      // escape message
      let textarea_value = JSON.stringify(document.getElementById('chat_input').value);
      let textarea_value_escaped = textarea_value.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f");


      // send to a user
      let send_message_url = send_message_user_api_url + current_chat + '/messages'
      fetch(send_message_url, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'text/plain',
        },
        body: document.getElementById('chat_input').value
      })
        .then(function (resp) {
          if (resp.status === 404) {
            alert(labels.user_offline)
          } else if (resp.status === 200) {
            store_chat_in_local_storage(current_chat, current_user, textarea_value_escaped)
            format_message_in_chat(current_chat)
            document.getElementById('chat_input').value = ""
          }

          return
        })
        .catch(function (error) {
          console.log(error)
        });
    } else {
      // send to a room
      let send_message_url = delete_room_api_url + current_chat + '/messages'
      fetch(send_message_url, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'text/plain',
        },
        body: document.getElementById('chat_input').value
      })
        .then(function (resp) {
          if (resp.status === 403) {
            alert("You are not a member of the room " + current_chat)
          } else {
            clear_chat_window()
            read_old_messages(current_chat)
          }
          document.getElementById('chat_input').value = ''
          return
        })
        .catch(function (error) {
          console.log(error)
        });
    }
  }
}

function update_room_header(room) {
  //TODO START CREATE HEADER
  // muss auch bei create romm true ausgeführt werden
  if (document.getElementsByClassName('room_header')[0] !== undefined) {
    document.getElementsByClassName('room_header')[0].remove()
  }


  let header = document.createElement("div")
  header.innerHTML = '<h3>Room: ' + room + '</h3>' // todo als label
  header.classList.add("room_header")
  document.getElementById("chat").prepend(header)
}

function clear_chat_window() {
  document.getElementById("chat_history").innerHTML = ''
}

function add_chat_window() {
  console.log('add_chat_window')
  let div = document.createElement("div")
  div.classList.add("room_container")
  return div
}

async function read_old_messages(room) {
  let fetch_rooms_messages = get_message_for_room_api_url + room + "/messages"
  await fetch(fetch_rooms_messages, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      format_message_in_chat(data)
      return
    })
    .catch(function (error) {
      console.log(error)
    });

  //scroll to end
  document.getElementsByClassName("room_container")[0].scrollTop = document.getElementsByClassName("room_container")[0].scrollHeight;

}

function enter_user_chat(user) {
  console.log('enter_user_chat')
  if (current_view === "") {
    alert("erst mal raum betreten bitte")
  } else {

    if (current_view != "user_chat") {
      leave_room(current_chat)
    }
    current_view = "user_chat"
    remove_old_user_list(current_chat)

    document.getElementsByClassName('room_header')[0].innerHTML = '<h3>User: ' + user + '</h3>'

    format_message_in_chat(user)
    add_li_to_privat_chat(user)
    current_chat = user
  }
}

function store_chat_in_local_storage(chat_partner, message_from, message) {
  // stores the direct messages in localstorage
  if (localStorage.getItem(chat_partner) === null) { // first message from a user     
    let text = '[{ "from_user":"' + message_from + '"  , "message":"' + addslashes(message) + '" }]'
    localStorage.setItem(chat_partner, text)
  } else {
    let text = '{ "from_user":"' + message_from + '"  , "message":"' + addslashes(message) + '" }'
    let old_messages = JSON.parse(localStorage.getItem(chat_partner))
    old_messages.push(JSON.parse(text))
    localStorage.setItem(chat_partner, JSON.stringify(old_messages))
  }
}

async function format_message_in_chat(data) {
  // makes html elements which contains the chat messages 

  if (typeof (data) === 'object') {
    // items for room chat
    document.getElementById("chat_history").innerHTML = ''
    let chat_window = document.createElement("div")
    chat_window.classList.add("room_container")
    document.getElementById('chat_history').append(chat_window)

    for (let item in data) {
      let p = document.createElement("p")

      if (data[item].message !== null) {
        message_tmp = data[item].message.replace("\n", "<br />");//.split("\n").join("<br />")
        if (data[item].user == current_user) {
          p.classList.add("from-me")
          p.innerHTML = message_tmp
        } else {
          p.classList.add("from-them")
          p.innerHTML = '<span class=user_name>' + data[item].user + '</span>:<br/> ' + message_tmp
        }
        chat_window.append(p)
      }
    }
  } else {
    document.getElementById("chat_history").innerHTML = ''
    let chat_window = document.createElement("div")
    chat_window.classList.add("user_chat_container")
    document.getElementById('chat_history').append(chat_window)

    // items for user chat
    if (localStorage.getItem(data) !== null) {
      let chat_history = JSON.parse(localStorage.getItem(data))

      for (let i = 0; i < chat_history.length; i++) {
        let p = document.createElement("p")
        message_tmp = chat_history[i].message.split("\n").join("<br />")
        if (chat_history[i].from_user == current_user) {
          p.classList.add("from-me")
          message_tmp = message_tmp.substring(1, message_tmp.length - 1);
          p.innerHTML = message_tmp
        } else {
          p.classList.add("from-them")
          p.innerHTML = '<span class=user_name>' + chat_history[i].from_user + '</span>:<br/> ' + message_tmp
        }

        chat_window.append(p)
      }
    }
  }
}

function add_li_to_privat_chat(user) {
  // only if not already in the list
  if (document.getElementById('private_chats').getElementsByClassName(user).length === 0) {
    let ul = document.getElementsByClassName('private_chats_ul')[0]
    let li = document.createElement("li");
    let btn = document.createElement("button")

    btn.innerHTML = user
    btn.value = user
    btn.classList.add(user)
    btn.addEventListener('click', function (event) {
      enter_user_chat(user)
    });
    li.appendChild(btn)
    ul.appendChild(li)
    ul.appendChild(li)
  }
}

function remove_old_user_list(room) {
  //removes the html list for the users in the room
  let user_list_of_room = document.getElementsByClassName('user_list_item')
  for (var index = 0; index < user_list_of_room.length; index++) {
    user_list_of_room[index].remove()
  }
}

function activate_user_chat_window(chat_partner) {
  current_view = "user_chat"
  current_chat = chat_partner


  document.getElementById("chat_history").innerHTML = ''
  if (document.getElementsByClassName("room_header")[0] !== undefined) {
    document.getElementsByClassName("room_header")[0].innerHTML = '<h3>User: ' + chat_partner + '</h3>'
  } else {
    // initialize if current user has just logged in - todo
    alert('user tried to contact you - please enter a room :) or fix the source code ;)')
  }
}

function check_old_private_chats() {
  // adds existing private chats to the screen
  for (let i = 0; i < localStorage.length; i++) {
    storage = JSON.parse(localStorage.getItem(localStorage.key(i)))
    add_li_to_privat_chat(storage[0].from_user)
  }
}

function create_new_room() {
  if (document.getElementById('new_room').value !== "") {
    enter_chat(true)
  }
  else {
    alert("please inser a valid user") //todo
  }

}