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

  //labels todo auslagern
  const label_users = "users"
  const label_rooms = "rooms"
  const label_add = "add"
  const label_need_message = "you can not send an empty message"
  const label_user_offline = "user seems to be unavailable"
  const label_message_sent = "message sent"

  var current_user = ""
  var current_room = ""
  var current_room_join_websocket //= new WebSocket()
  var current_room_message_websocket //= new WebSocket()


  function init() {

    console.log("init")

    fetch(auth_api_url, {
      credentials: "include",
      mode: "cors",
    })
      .then(function (resp) {
        //if (resp.status == 401)
        return resp.json()
      })
      .then((json) => {
        if (json.hasOwnProperty("verification_uri")) {
          login_visible(json.verification_uri, json.user_code)
        } else {
          // user is logged in - clean up first :)
          current_user = json.user

          leave_all_rooms()
          get_rooms()
          get_users()
          start_user_message_socket()

          //todo anpassen von chat history max-height
          document.getElementById("chat_history").style.height = screen.height * 0.75;
          //scroll to end
          document.getElementById("chat_history").scrollTop = document.getElementById("chat_history").scrollHeight;
        }
      })
      .catch((error) => {
        console.log(error)
      });
  }

  //todo login_visible login_hide vereinen mit true false paramter
  function login_visible(url, code) {
    document.getElementById("overlay").style.display = "block"

    let tmpStr = document.getElementById("text").innerHTML
    document.getElementById("text").innerHTML = "Please login fist <a href='" + url + "' target='blank'>here</a> <br/>" + "with code <br/><b>" + code + "</b>" + tmpStr
  }

  function login_hide(url, code) {
    document.getElementById("overlay").style.display = "none";
    init()
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
          li = create_room_html(room)
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

  function create_room_html(room) {
    let li = document.createElement("li")
    let btn = document.createElement("button")
    btn.innerHTML = room
    btn.value = room
    btn.classList.add(room);
    //todo net nur klick
    btn.addEventListener("click", enter_chat)
    li.appendChild(btn)

    return li
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
          li = create_user_html(user)
          ul.appendChild(li)
        }

        document.getElementById('users').append(ul)
        return
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  function create_user_html(user) {
    let li = document.createElement("li")
    let btn = document.createElement("button")
    btn.innerHTML = user
    btn.value = user
    btn.classList.add(user);
    //todo net nur klick
    btn.addEventListener('click', function (event) {
      //send_message_to_user(user)
      enter_user_chat(user)
    });

    li.appendChild(btn)

    return li
  }

  // wird aufgerufen bei room-button click
  function enter_chat(create_new_room) {
    // update header
    document.getElementById('chat_send').onclick = function () { send_message_in_room(); }

    // initialize variables
    let enter_fetch_url = ""
    let room = ""

    // need for difference url room name
    room = this.value

    //todo bug wenn in rraum wechsel hin und her und wieder zurück --> 409 confilct. muss raum zuerst verlassen!
    console.log('current_room: ' + current_room)
    console.log('room: ' + room)
    if (create_new_room === true) {
      enter_fetch_url = join_room_api_url + document.getElementById('new_room').value + '/users'
    } else {
      enter_fetch_url = join_room_api_url + room + '/users'
    }

    if (current_room == room) {
      console.log("You are already in the room " + room)
      read_old_messages(room)
    }
    else {
      if (current_room != "") {
        leave_room(current_room)
      }

      // enter new room
      fetch(enter_fetch_url, {
        method: 'POST',
        credentials: "include",
      })
        .then(function (resp) {
          current_room = room
          console.log('message sent status')
          console.log(resp.status)
          if (resp.status = 200) {
            // you joined the room 
            read_old_messages(room)
            if (current_room_join_websocket !== undefined && current_room_join_websocket.readyState === 3) {
              current_room_join_websocket.close()
              current_room_message_websocket.close()
            }
            current_room_join_websocket = start_room_message_sockets(room)
            current_room_message_websocket = start_room_join_sockets(room)

          } else if (resp.status = 201) {
            // you created and joined the room 
            if (current_room_join_websocket !== undefined && current_room_join_websocket.readyState === 3) {
              current_room_join_websocket.close()
              current_room_message_websocket.close()
            }
            current_room_join_websocket = start_room_message_sockets(room)
            current_room_message_websocket = start_room_join_sockets(room)

          }
          else if (resp.status = 404) {
            console.log("passiert doch net, oder? todo 2 You are not in the room " + room)
          }

          return
        })
        .catch(function (error) {
          console.log(error)
        });

      // list users in room
      get_user_in_rooms(room)
      get_users()
    }
  }

  function get_user_in_rooms(room_name) {
    console.log('get_user_in_rooms')

    fetch(revieve_user_in_room_api_url + room_name + '/users', {
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
    let ul = document.createElement('ul')
    let room_list_item = document.getElementById("rooms").getElementsByClassName(room_name)[0];

    for (let user of user_data) {
      let li = document.createElement('li')

      li.setAttribute('class', 'user_in_room')
      li.innerHTML = user
      ul.append(li)
    }
    room_list_item.after(ul)
  }

  function send_message_in_room() {
    if (document.getElementById('chat_input').value.length === 0) {
      alert(label_need_message)
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
          if (resp.status = 409) {
            // message sent
            document.getElementById('chat_input').value = ""
            read_old_messages(current_room)
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
  }

  function read_old_messages(room) {
    document.getElementById('chat_history').innerHTML = '<h3>' + room + '</h3>'

    let fetch_rooms_messages = get_message_for_room_api_url + room + "/messages"
    let enter_fetch_url = ""

    fetch(fetch_rooms_messages, {
      credentials: "include",
    })
      .then((resp) => resp.json())
      .then(function (data) {
        let ul = document.createElement('ul')

        for (let item in data) {
          //format_message_in_chat()
          let p = document.createElement("p")
          if (data[item].user == current_user) {
            p.classList.add("from-me")
            p.innerHTML = data[item].message
          } else {
            p.classList.add("from-them")
            p.innerHTML = data[item].user + ': ' + data[item].message
          }

          document.getElementById('chat_history').append(p)
        }

        return
      })
      .catch(function (error) {
        console.log(error)
      });
  }

  function enter_user_chat(user) {
    console.log('enter_user_chat')
    console.log(user)
    document.getElementById('chat_history').innerHTML = '<h3>Chat with user ' + user + '</h3>'
    document.getElementById('chat_send').onclick = function () { send_message_to_user(user); }
  }

  function send_message_to_user(user) {

let chat_message = document.getElementById('chat_input').value

    if (document.getElementById('chat_input').value.length === 0) {
      alert(label_need_message)
    }
    else {
      let send_message_url = send_message_user_api_url + user + '/messages'
      console.log('send_message_url: ' + send_message_url)
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
            alert(label_user_offline)
          } else if (resp.status === 200) {
            document.getElementById('chat_input').value = ""

            if (localStorage.getItem(user) === null) { // first message from a user     
              console.log('first message to user') 
              let text = '[{ "from_user":"' + current_user + '"  , "message":"' + chat_message + '" }]'
              localStorage.setItem(user, text)
            } else {
              console.log('old chat ')
              let text = '{ "from_user":"' + current_user + '"  , "message":"' + chat_message + '" }'
              console.log(JSON.parse(text))
      
              let old_messages = JSON.parse(localStorage.getItem(user))
              old_messages.push(JSON.parse(text))
      
              localStorage.setItem(user, JSON.stringify(old_messages))
            }
          }

          return
        })
        .catch(function (error) {
          console.log(error)
        });
    }
  }

  function leave_all_rooms() {

    fetch(leave_room_api_url + current_user + '/rooms', {
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

  function leave_room(room_name) {
    let delete_fetch_url = delete_room_api_url + room_name + '/users'

    fetch(delete_fetch_url, {
      method: 'delete',
      credentials: "include",
    })
      .catch(function (error) {
        console.log(error)
      })

    end_room_sockets(room_name)

    // remove old user in room list
    //todo nicht bei neuladen oder wenn room_name leer ist

    console.log('room name leer?')
    console.log(room_name)
    document.getElementById("rooms").getElementsByClassName(room_name)[0].nextSibling.innerHTML = ""
  }

  function start_room_message_sockets(room_name) {

    //Receive new messages
    let socket_room_messages = new WebSocket(socket_room_message_api_url + room_name + "/messages")

    socket_room_messages.onmessage = function (e) {
      read_old_messages(current_room)
      return false
    }

    return socket_room_messages

  }

  function start_room_join_sockets(room_name) {

    //Receive new joins and leaves 
    let socket_room_joins = new WebSocket(socket_room_joins_api_url + room_name + "/users")
    socket_room_joins.onmessage = function (e) {
      let server_message = JSON.parse(e.data)

      let type = server_message.type
      let user = server_message.user

      document.getElementById("chat_history")

      let p = document.createElement("p")
      p.innerHTML = user + ' ' + type
      p.classList.add("room_info");

      document.getElementById("chat_history").append(p)

      get_users()
      return false
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

  function start_user_message_socket() {
    const ws = new WebSocket("wss://chatty.1337.cx/me/messages")

    ws.onmessage = function (e) {
      let server_message = JSON.parse(e.data)
      console.log('server message to usre')
      console.log(server_message.user)

      if (localStorage.getItem(server_message.user) === null) { // first message from a user      
        let text = '[{ "from_user":"' + server_message.user + '"  , "message":"' + server_message.message + '" }]'
        localStorage.setItem(server_message.user, text)
      } else {
        let text = '{ "from_user":"' + server_message.user + '"  , "message":"' + server_message.message + '" }'
        console.log(JSON.parse(text))

        let old_messages = JSON.parse(localStorage.getItem(server_message.user))
        old_messages.push(JSON.parse(text))

        localStorage.setItem(server_message.user, JSON.stringify(old_messages))
      }


      localStorage.getItem('server_message.user')


      return
    }
  }