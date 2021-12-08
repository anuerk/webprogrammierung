/*
here happens the logic for the chat client
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
var current_room = ""
var current_room_join_websocket //= new WebSocket()
var current_room_message_websocket //= new WebSocket()
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
  /* this is the entry point */

  console.log("init")
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
        console.log('call display_login false')
        display_login(json.verification_uri, json.user_code, false)
        logged_in = false
      } else {
        // user is logged in - clean up first :)
        current_user = json.user
        logged_in = true
      }

    })
    .catch((error) => {
      console.log(error)
    });
    console.log('user is: ' +logged_in )

    if(logged_in === true){
      await leave_all_rooms()
      await start_user_message_socket()
      await get_rooms()
    }

  return
}

async function get_rooms() {
  /*
  baut gerade den inhalt des kompletten rooms divs auf
  todo macht zu viel
  */

  document.getElementById('rooms').innerHTML = '<h2>' + labels.rooms + '</h2>'
  let ul = document.createElement('ul')
  let rooms = await fetch(get_rooms_api_url, {
    credentials: "include",
  }).then(response => response.json());

  for (let room of rooms) {
    //li = create_room_html(room)
    let li = document.createElement("li")
    let btn = document.createElement("button")
    btn.innerHTML = room
    btn.value = room
    btn.classList.add(room);
    btn.addEventListener("click", enter_chat)
    li.appendChild(btn)
    ul.appendChild(li)
  }

  let li = document.createElement("li")
  let btn = document.createElement("button")
  btn.innerHTML = labels.add
  btn.value = labels.add
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

function display_login(url, code, hide) { // todo tausche true false
  console.log('display_login')
  if (hide === true) {
    document.getElementById("overlay").style.display = "none"; //todo z index
    init()
  } else {
   
    let tmpStr = document.getElementById("login_info").innerHTML
    document.getElementById("login_info").innerHTML = "Please login fist <a href='" + url + "' target='blank'>here</a> <br/>" + "with code <br/><b>" + code + "</b>" + tmpStr
    document.getElementById("overlay").style.display = "block"
    document.getElementById("logged_in").style.display = ""
  }
}

function show_loading(show, text) {
  console.log('show_loading')
  //debugger
  if (show === true) {
    document.getElementById("overlay").style.display = "block"
    document.getElementById("container").style.display = "none"
  
    if (typeof (text) !== undefined) {
      let spinner = document.createElement("div")
      spinner.classList.add('loading_spinner')
      console.log('xxx')
      console.log(current_user)
      if(current_user){

      console.log('current user in if')
      document.getElementById("login_info").innerHTML='<p>site is loading...</p>' //labels.loading
      document.getElementById("login_info").append(spinner)
      }else{
        console.log('current user in else')
      }
      
    }
  } else {
    document.getElementById("container").style.display = "flex"
    document.getElementById("overlay").style.display = "none";
  }
}

async function leave_all_rooms() {
  // will be called by initial
  console.log('leave_all_rooms')

  await fetch(leave_room_api_url + current_user + '/rooms', {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('then in fetch leav_all_rooms')
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
  console.log('you will leave to room ' + room_name)
  let delete_fetch_url = delete_room_api_url + room_name + '/users'

  fetch(delete_fetch_url, {
    method: 'delete',
    credentials: "include",
  })
    .then(function (data) {
      if (typeof (document.getElementsByClassName('user_list_item')[0]) !== "undefined") {
        console.log('inif - soll aber niemals sein ')
        console.log(document.getElementsByClassName('user_list_item'))
        document.getElementsByClassName('user_list_item')[0].remove()
      }

      // remove existing user list in room but only if it not the first call
      /*if (typeof (document.getElementsByClassName('user_list_item')[0]) !== "undefined") {
       console.log('inif')
       console.log(document.getElementsByClassName('user_list_item'))
       document.getElementsByClassName('user_list_item')[0].remove()

       // not sure why this happens - need help :( sometimes there are still the old user lists (if you switch fast the rooms) - todoF
      /* if (document.getElementsByClassName('user_list_item').length > 1) {
         console.log('da ist ja mejhr :_(')
         let elements = document.getElementsByClassName('user_list_item')
         while (elements.length > 0) {
          // elements[0].parentNode.removeChild(elements[0]);
         }
       }
     }*/


      end_room_sockets(room_name)

      return
    })
    .catch(function (error) {
      console.log(error)
    })
}

/*
function create_room_html(room) {
  let li = document.createElement("li")
  let btn = document.createElement("button")
  btn.innerHTML = room
  btn.value = room
  btn.classList.add(room);
  btn.addEventListener("click", enter_chat)
  li.appendChild(btn)

  return li
}*/

function create_user_html(user) {
  let li = document.createElement("li")

  let btn = document.createElement("button")
  btn.innerHTML = user
  btn.value = user
  btn.classList.add(user);
  btn.addEventListener('click', function (event) {
    enter_user_chat(user)
  });

  li.appendChild(btn)

  return li
}

// wird aufgerufen bei room-button click
async function enter_chat(create_new_room) {
  //todo vergleiche fetch await mit login, dass loading mask tut :)
  console.log('enter chat')
  show_loading(true)

  // update header
  document.getElementById('chat_send').onclick = function () { send_message_in_room(); }
  current_view = "room"
  // initialize variables
  let enter_fetch_url = ""
  let room = ""

  // need for difference url room name
  room = this.value

  if (create_new_room === true) {
    enter_fetch_url = join_room_api_url + document.getElementById('new_room').value + '/users'
  } else {
    enter_fetch_url = join_room_api_url + room + '/users'
  }

  if (current_room != room) {
    if (current_room != "") {
      (async () => {
        await leave_room(current_room)
      })();

    }

    // enter new room
    await fetch(enter_fetch_url, {
      method: 'POST',
      credentials: "include",
    })
      .then(function (resp) {
        current_room = room

        if (resp.status = 200) {
          // you joined the room 
          read_old_messages(room)
          if (current_room_join_websocket !== undefined && current_room_join_websocket.readyState === 3) {
            current_room_join_websocket.close()
          }
          if (current_room_message_websocket !== undefined && current_room_message_websocket.readyState === 3) {
            current_room_message_websocket.close()
          }

          current_room_message_websocket = start_room_message_sockets(room)
          current_room_join_websocket = start_room_join_sockets(room)

        } else if (resp.status = 201) {
          // you created and joined the room 
          if (current_room_join_websocket !== undefined && current_room_join_websocket.readyState === 3) {
            current_room_join_websocket.close()
            current_room_message_websocket.close()
          }
          current_room_message_websocket = start_room_message_sockets(room)
          current_room_join_websocket = start_room_join_sockets(room)
        }

        // list users in room
        if (current_room_join_websocket.readyState !== 3) {
          get_user_in_rooms(room)
        }

        return
      })
        .catch(function (error) {
          console.log(error)
        });
  }

  document.querySelector("#chat_new").style.display = ''
}

async function get_user_in_rooms(room_name) {
  console.log('get_user_in_rooms')

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
}

function format_users_in_room_html(room_name, user_data) {
  console.log('format_users_in_room_html')
  // remove old list if it exists
  if (document.getElementById("rooms").getElementsByClassName(room_name)[0].nextSibling !== null) {
    document.getElementById("rooms").getElementsByClassName(room_name)[0].nextSibling.innerHTML = ''
  } 

  let ul = document.createElement('ul')
  ul.classList.add('user_list_item')
  let room_list_item = document.getElementById("rooms").getElementsByClassName(room_name)[0];

  for (let user of user_data) {
    let li = create_user_html(user)
    ul.append(li)
  }
  room_list_item.after(ul)
  show_loading(false)
}

function send_message_in_room() {
  if (document.getElementById('chat_input').value.length === 0) {
    alert(labels.need_message)
  }
  else {
    let send_message_url = delete_room_api_url + current_room + '/messages'
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
          alert("You are not a member of the room " + room)
        }
        document.getElementById('chat_input').value = ''
        return
      })
      .catch(function (error) {
        console.log(error)
      });
  }
}

async function read_old_messages(room) {
  document.getElementById("chat_history").innerHTML = ''

  // create room header -todo evtl auslagern
  if (document.getElementsByClassName('room_header')[0] !== undefined) {
    document.getElementsByClassName('room_header')[0].remove()
  }


  let header = document.createElement("div")
  header.innerHTML = '<h3>Room: ' + room + '</h3>' // todo als label
  header.classList.add("room_header")
  document.getElementById("chat").prepend(header)

  let div = document.createElement("div")
  div.classList.add("room_container")



  document.getElementById('chat_history').append(div)

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
}

function enter_user_chat(user) {
  console.log('enter user chat')
  document.getElementsByClassName('room_header')[0].innerHTML = '<h3>User: ' + user + '</h3>'
  format_message_in_chat(user)
  add_li_to_privat_chat(user)
  document.getElementById('chat_send').onclick = function () { send_message_to_user(user); }
}

function send_message_to_user(user) {
  console.log('will send a messega to user ' + user)

  let chat_message = document.getElementById('chat_input').value

  if (document.getElementById('chat_input').value.length === 0) {
    alert(labels.need_message)
  }
  else {
    let send_message_url = send_message_user_api_url + user + '/messages'
    fetch(send_message_url, {
      method: 'POST',
      credentials: "include",
      headers: {
        'Content-Type': 'text/plain',
      },
      body: chat_message
    })
      .then(function (resp) {
        if (resp.status === 404) {
          alert(labels.user_offline)
        } else if (resp.status === 200) {
          document.getElementById('chat_input').value = ""

          store_chat_in_local_storage(user, current_user, chat_message)
          format_message_in_chat(user)
        }

        return
      })
      .catch(function (error) {
        console.log(error)
      });
  }
}

async function start_user_message_socket() {
  const ws = new WebSocket("wss://chatty.1337.cx/me/messages") // todo hier const unten let ??

  ws.onmessage = function (e) {
    let server_message = JSON.parse(e.data)
    alert('server message from user' + server_message.user)
    add_li_to_privat_chat(user)
    store_chat_in_local_storage(server_message.user, server_message.user, server_message.message)
    format_message_in_chat(server_message.user)
  }
}

function add_li_to_privat_chat(user) {
  console.log('add_li_to_privat_chat' + user)
  let ul = document.getElementsByClassName('private_chats_ul')[0]
  let li = document.createElement("li");
  li.appendChild(document.createTextNode(user));
  ul.appendChild(li);
}

async function start_room_message_sockets(room_name) {
  // tut net :(
  //Receive new messages
  let socket_room_messages = new WebSocket(socket_room_message_api_url + room_name + "/messages")

  socket_room_messages.onmessage = function (e) {
    let server_message = JSON.parse(e.data)
    alert('new message in room :) ')
    //read_old_messages(current_room)
    return
  }

  console.log(socket_room_messages)

  return socket_room_messages

}

async function start_room_join_sockets(room_name) {
  //Receive new joins and leaves 
  let socket_room_joins = new WebSocket(socket_room_joins_api_url + room_name + "/users")
  socket_room_joins.onmessage = function (e) {
    let server_message = JSON.parse(e.data)

    if (server_message.user !== current_user) {
      console.log('rufe get users auf aus wss joins')
      console.log(server_message)
      get_user_in_rooms(current_room)
    }

    let p = document.createElement("p")

    p.innerHTML = server_message.user + ' ' + server_message.type
    p.classList.add("room_info");

    document.getElementsByClassName('room_container')[0].append(p)
    //scroll to end
    document.getElementById("chat_history").scrollTop = document.getElementById("chat_history").scrollHeight;
    return
  }

  return socket_room_joins
}

function end_room_sockets(room_name) {
  //Receive new messages
  let socket_room_messages = new WebSocket(socket_room_message_api_url + room_name + "/messages")

  socket_room_messages.onmessage = function (e) {
    var server_message = e.data
    //todo
    alert('wss reponse ' + room_name + ' : ' + server_message)
    return false
  }
}




function store_chat_in_local_storage(chat_partner, message_from, message) {
  // stores the direct messages in localstorage
console.log('store_chat_in_local_storage')


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

function format_message_in_chat(data) {
  // makes html elements which contains the chat messages 
  // todo evtl ausmisten

  if (typeof (data) === 'object') {
    // items for room chat
    let chat_window = document.getElementsByClassName('room_container')[0]


    for (let item in data) {
      let p = document.createElement("p")
      if (data[item].user == current_user) {
        p.classList.add("from-me")
        p.innerHTML = data[item].message
      } else {
        p.classList.add("from-them")
        p.innerHTML = '<span class=user_name>' + data[item].user + '</span>: ' + data[item].message
      }

      chat_window.append(p)
    }
  } else {


    document.getElementById("chat_history").innerHTML = ''
    let chat_window = document.createElement("div")
    chat_window.classList.add("user_chat_container")
    document.getElementById('chat_history').append(chat_window)

    // items for user chat
    if (localStorage.getItem(data) !== null) {
      let chat_history = JSON.parse(localStorage.getItem(data))
      //chat_window.
      for (let i = 0; i < chat_history.length; i++) {
        let p = document.createElement("p")
        if (chat_history[i].from_user == current_user) {
          p.classList.add("from-me")
          p.innerHTML = chat_history[i].message
        } else {
          p.classList.add("from-them")
          p.innerHTML = '<span class=user_name>' + chat_history[i].from_user + '</span>: ' + chat_history[i].message
        }

        chat_window.append(p)
      }
    }
  }
  //scroll to end
  document.getElementById("chat_history").scrollTop = document.getElementById("chat_history").scrollHeight;
}

function addslashes(str) {
  //helper to make json valid
  //todo escape linebreak
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0')
}

//helper to fit the chat
window.addEventListener('resize', function (event) {
  console.log('resized ')

  //document.getElementById("chat_history")
  //document.getElementById("chat_history").style.height = screen.height * 0.75;
  // would be nice if i could do something when the browser zoom is active :(
}, true);


