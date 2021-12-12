/*
here happens the logic for the chat client

- todo alerts
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
let userLang = navigator.language || navigator.userLanguage
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
  function (u) { return u.json() }
).then(
  function (json) {
    labels = json
  }
)

async function init() {
  // this is the entry point 
  document.querySelector("#chat_new").style.display = 'none'
  show_loading(true)
  let logged_in = false
  await fetch(auth_api_url, {
    credentials: "include"
  })
    .then(function (resp) {
      if (resp.status == 401) {
        return resp.json()
      }
      else if (resp.status == 400) {
        location.reload()
      }
      else {

        return resp.json()
      }
    })
    .then((json) => {
      if (json !== undefined) {
        if (json.hasOwnProperty("verification_uri")) {
          display_login(json.verification_uri, json.user_code, false)
          logged_in = false
          localStorage.clear()
        } else {
          // user is logged in - clean up first :)
          current_user = json.user
          logged_in = true
        }
      }
    })
    .catch((error) => {
      console.log(error)
    })

  if (logged_in === true) {
    await leave_all_rooms()
    start_user_message_socket()
    await get_rooms()
    check_old_private_chats()

    set_ui_labels()
    show_loading(false)
  }
  return
}

async function get_rooms() {
  // remove existing rooms
  document.getElementById('rooms').innerHTML = ''

  // get new ones
  let ul = document.createElement('ul')
  let rooms = await fetch(get_rooms_api_url, {
    credentials: "include",
  }).then(response => response.json())

  // and make it "nice"
  for (let room of rooms) {
    let tmp = room.replace(/\s/g, "")

    let li = document.createElement("li")
    let btn = document.createElement("button")

    btn.innerHTML = room
    btn.value = room
    btn.classList.add(tmp)
    btn.addEventListener("click", enter_chat)
    li.appendChild(btn)
    ul.appendChild(li)
  }

  document.getElementById('rooms').append(ul)

}

function display_login(url, code, hide) {
  if (hide === true) {
    document.getElementById("overlay").style.display = "none"
    init()
  } else {
    // needs a login 
    document.getElementById("login_info").innerHTML = labels.login_first + "<p><a href='" + url + "' target='blank'>" + labels.here + "</a></p>" + labels.overlay_part_2 + "<br/><b>" + code + "</b>"
    document.getElementById("overlay").style.display = "block"

    let p = document.createElement("p")
    let btn = document.createElement("button")
    btn.innerHTML = labels.done
    btn.id = "logged_in"

    btn.addEventListener('click', function (event) {
      display_login('', '', true)
    })

    p.appendChild(btn)

    document.getElementById("login_info").appendChild(p)
    document.getElementById("container").style.display = 'none'
  }

}

async function leave_all_rooms() {
  // will be called by initial

  await fetch(leave_room_api_url + encodeURIComponent(current_user) + '/rooms', {
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
    })
}

async function leave_room(room_name) {
  let delete_fetch_url = delete_room_api_url + encodeURIComponent(room_name)
  await fetch(delete_fetch_url.concat('/users'), {
    method: 'delete',
    credentials: "include",
  })
    .then(function (data) {
      remove_old_user_list(room_name)
      return
    })
    .catch(function (error) {
      loading_error()
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
  document.getElementById('chat_input').value = ''

  // initialize variables
  let enter_fetch_url = ""
  let room = ""

  // need for difference url room name
  room = this.value

  if (current_chat != room || current_view === "user_chat" || (create_new_room && document.getElementById('new_room').value !== "")) {
    show_loading(true)

    if (current_chat != "" && current_view == "room") {
      (async () => {
        await leave_room(current_chat)
      })()

    }
    current_view = "room"

    if (create_new_room === true) {
      document.getElementById('new_room').value
      enter_fetch_url = join_room_api_url + encodeURIComponent(document.getElementById('new_room').value)
      room = document.getElementById('new_room').value
    } else {
      enter_fetch_url = join_room_api_url + encodeURIComponent(room)
    }

    // enter new room
    await fetch(enter_fetch_url.concat('/users'), {
      method: 'POST',
      credentials: "include",
    })
      .then(function (resp) {
        current_chat = room

        if (resp.status == 200) {
          // you joined the room 
          update_room_header(room)
          clear_chat_window()
          document.getElementById('chat_history').append(add_chat_window())
          read_old_messages(room)
        }
        else if (resp.status == 201) {
          room = document.getElementById('new_room').value
          current_chat = document.getElementById('new_room').value
          document.getElementById('new_room').value = ''
          update_room_header(room)
          clear_chat_window()
          document.getElementById('chat_history').append(add_chat_window())
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
        loading_error()
        console.log(error)
      })
  }
  document.querySelector("#chat_new").style.display = ''
}

async function get_user_in_rooms(room_name) {
  await fetch(revieve_user_in_room_api_url + encodeURIComponent(room_name) + '/users', {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      format_users_in_room_html(room_name, data)
      return
    })
    .catch(function (error) {
      console.log(error)
    })
  scroll_to_end()

}

function format_users_in_room_html(room_name, user_data) {
  let tmp = room_name.replace(/\s/g, "")

  let ul = document.createElement('ul')
  ul.classList.add('user_list_item')
  if (document.getElementById("rooms").getElementsByClassName(tmp)[0] !== undefined) {
    let room_list_item = document.getElementById("rooms").getElementsByClassName(tmp)[0]

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
      // escape message to store the json in localstorage
      let textarea_value = JSON.stringify(document.getElementById('chat_input').value)
      let textarea_value_escaped = textarea_value.replace(/\\n/g, "\\n")
        .replace(/\\'/g, "\\'")
        .replace(/\\"/g, '\\"')
        .replace(/\\&/g, "\\&")
        .replace(/\\r/g, "\\r")
        .replace(/\\t/g, "\\t")
        .replace(/\\b/g, "\\b")
        .replace(/\\f/g, "\\f")


      // send to a user
      let send_message_url = send_message_user_api_url + encodeURIComponent(current_chat) + '/messages'
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
        })
    } else {
      // send to a room
      let send_message_url = delete_room_api_url + encodeURIComponent(current_chat) + '/messages'
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
            alert(labels.not_a_member_of_room + current_chat)
          } else {
            clear_chat_window()
            read_old_messages(current_chat)
          }
          document.getElementById('chat_input').value = ''
          return
        })
        .catch(function (error) {
          console.log(error)
        })
    }
  }
}

function update_room_header(room) {
  // muss auch bei create romm true ausgeführt werden
  if (document.getElementsByClassName('room_header')[0] !== undefined) {
    document.getElementsByClassName('room_header')[0].remove()
  }


  let header = document.createElement("div")
  header.innerHTML = '<h3>' + labels.header_room + room + '</h3>'
  header.classList.add("room_header")
  document.getElementById("chat").prepend(header)
}

function clear_chat_window() {
  document.getElementById("chat_history").innerHTML = ''
}

function add_chat_window() {
  let div = document.createElement("div")
  div.classList.add("room_container")
  return div
}

async function read_old_messages(room) {
  let fetch_rooms_messages = get_message_for_room_api_url + encodeURIComponent(room) + "/messages"
  await fetch(fetch_rooms_messages, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      format_message_in_chat(data)
      //todo
      //document.getElementsByClassName("room_container")[0].scrollTop = document.getElementsByClassName("room_container")[0].scrollHeight

      return
    })
    .catch(function (error) {
      console.log(error)
    })

}

function enter_user_chat(user) {
  if (current_view === "") {
    alert(labels.need_room_enter)
  } else {

    if (current_view != "user_chat") {
      leave_room(current_chat)
    }
    current_view = "user_chat"
    remove_old_user_list(current_chat)

    document.getElementsByClassName('room_header')[0].innerHTML = '<h3>' + labels.header_user + user + '</h3>'

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
    console.log('probleme')
    console.log(text)
    //console.log(JSON.parse(text))
    old_messages.push(text)
    localStorage.setItem(chat_partner, JSON.stringify(old_messages))
  }
}

async function format_message_in_chat(data) {
  // makes html elements which contains the chat messages 
  let msg_width = window.outerWidth * 0.2
  if (typeof (data) === 'object') {
    // items for room chat
    document.getElementById("chat_history").innerHTML = ''
    let chat_window = document.createElement("div")
    chat_window.classList.add("room_container")
    document.getElementById('chat_history').append(chat_window)

    for (let item in data) {
      let p = document.createElement("p")
      //p.style.width = msg_width + 'px'
      if (data[item].message !== null) {
        message_tmp = data[item].message.replace("\n", "<br />")//.split("\n").join("<br />")
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
    chat_window.scrollTop = chat_window.scrollHeight
  } else {
    //todo special char problem when saving json
    document.getElementById("chat_history").innerHTML = ''
    let chat_window = document.createElement("div")
    chat_window.classList.add("user_chat_container")
    document.getElementById('chat_history').append(chat_window)

    // items for user chat
    if (localStorage.getItem(data) !== null) {
      let chat_history = JSON.parse(localStorage.getItem(data))

      for (let i = 0; i < chat_history.length; i++) {
        let p = document.createElement("p")
        p.style.width = msg_width + 'px'
        if (chat_history[i].message !== undefined) { //todo escape specail chars
          message_tmp = chat_history[i].message.split("\n").join("<br />")
          if (chat_history[i].from_user == current_user) {
            p.classList.add("from-me")
            message_tmp = message_tmp.substring(1, message_tmp.length - 1)
            p.innerHTML = message_tmp
          } else {
            p.classList.add("from-them")
            p.innerHTML = '<span class=user_name>' + chat_history[i].from_user + '</span>:<br/> ' + message_tmp
          }
        }
        chat_window.append(p)
      }
    }
    chat_window.scrollTop = chat_window.scrollHeight
  }
}

function add_li_to_privat_chat(user) {
  // only if not already in the list
  if (document.getElementById('private_chats').getElementsByClassName(user).length === 0) {
    if (user != current_user) {
      let ul = document.getElementsByClassName('private_chats_ul')[0]
      let li = document.createElement("li")
      let btn = document.createElement("button")

      btn.innerHTML = user
      btn.value = user
      btn.classList.add(user)
      btn.addEventListener('click', function (event) {
        enter_user_chat(user)
      })
      li.appendChild(btn)
      ul.appendChild(li)
      ul.appendChild(li)
    }
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
    document.getElementsByClassName("room_header")[0].innerHTML = '<h3>' + labels.header_user + chat_partner + '</h3>'
  } else {
    // initialize if current user has just logged in
    alert(labels.message_but_problem)
  }
}

function check_old_private_chats() {
  // adds existing private chats to the screen
  for (let key of Object.keys(localStorage)) {
    if (key.length !== undefined) {
      storage = JSON.parse(localStorage.getItem(key))
      add_li_to_privat_chat(key)
    }
  }
}

function create_new_room() {
  if (document.getElementById('new_room').value !== "") {
    enter_chat(true)
  }
  else {
    alert(labels.insert_value)
  }

}

function set_ui_labels() {
  // set all labels depending on the browser language
  document.getElementById("rooms_header").innerHTML = "<h2>" + labels.header_room + "</h2>"
  document.getElementById("private_chats_header").innerHTML = "<h2>" + labels.header_private_chat + "</h2>"
  document.getElementById("rooms_info_text").innerHTML = "<p>" + labels.room_info_text + "</p>"
  document.getElementById("label_chat_text").innerHTML = labels.label_chat_text
  document.getElementById("label_chat_send").innerHTML = labels.label_chat_send
  document.getElementById("chat_send").innerHTML = labels.chat_send
  document.getElementById("lable_new_room_txt").innerHTML = labels.label_new_room_txt + "<br />"
  document.getElementById("label_new_room_button").innerHTML = labels.label_new_room_button
  document.getElementById("new_room_btn").innerHTML = labels.new_room_btn
}