
async function start_room_join_sockets(room_name) {
  //Receive new joins and leaves 
  console.log('start_room_join_sockets')
  let socket_room_joins = new WebSocket(socket_room_joins_api_url + room_name + "/users")
 
  socket_room_joins.onmessage = function (e) {
    let server_message = JSON.parse(e.data)

    if (server_message.user !== current_user) {
      console.log('rufe get users auf aus wss joins')
      console.log(server_message)
      remove_old_user_list(current_chat)
      get_user_in_rooms(current_chat)
    }

    let p = document.createElement("p")

    p.innerHTML = server_message.user + ' ' + server_message.type
    p.classList.add("room_info");

    //document.getElementsByClassName('room_container')[0].append(p)
    //scroll to end
    document.getElementById("chat_history").scrollTop = document.getElementById("chat_history").scrollHeight;
    return
  }
//sockets.append(socket_room_joins)
  return socket_room_joins
}

async function end_room_sockets(websocket) {

  console.log('end_room_sockets: ' + room_name)

  websocket.close()
}


async function start_room_message_sockets(room_name) {
  // tut net :(
  //Receive new messages

  console.log('start_room_message_sockets: ' + room_name)
  let test = new WebSocket(socket_room_message_api_url + room_name + "/messages")

  test.onmessage = function (e) {
    let server_message = JSON.parse(e.data)
    //alert('new message in room :) ')
    read_old_messages(current_chat)
    return
  }

  console.log(test)
//  sockets.append(test)
  return test

}


async function start_user_message_socket() {
  console.log('start_user_message_socket')
  const ws = new WebSocket("wss://chatty.1337.cx/me/messages") // todo hier const unten let ??

  ws.onmessage = function (e) {
    let server_message = JSON.parse(e.data)
    alert('server message from user' + server_message.user)
    add_li_to_privat_chat(server_message.user)
    store_chat_in_local_storage(server_message.user, server_message.user, server_message.message)
    activate_user_chat_window(server_message.user)
    format_message_in_chat(server_message.user)
  }
}

