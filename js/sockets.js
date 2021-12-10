function start_room_join_sockets(room_name) {
  //Receive new joins and leaves 

  let socket_room_joins = new WebSocket(socket_room_joins_api_url + encodeURIComponent(room_name) + "/users")

  socket_room_joins.onmessage = function (e) {
    let server_message = JSON.parse(e.data)

    if (server_message.user !== current_user && current_view !== "user_chat") {

      remove_old_user_list(current_chat)
      get_user_in_rooms(current_chat)

      document.getElementsByClassName("room_container")[0]
      let p = document.createElement("p")
      p.innerHTML = server_message.user + ' ' + server_message.type
      p.classList.add("room_info")
      document.getElementsByClassName("room_container")[0].append(p)
      change_favicon(true)
      //scroll to end
      document.getElementsByClassName("room_container")[0].scrollTop = document.getElementsByClassName("room_container")[0].scrollHeight
    }
    return
  }
  return socket_room_joins
}

function start_room_message_sockets(room_name) {
  //Receive new messages for a room
  let ws = new WebSocket(socket_room_message_api_url + encodeURIComponent(room_name) + "/messages")

  ws.onmessage = function (e) {
    read_old_messages(current_chat)
    change_favicon(true)
    return
  }
  return ws
}

function start_user_message_socket() {
  //Receive new private messages
  let ws = new WebSocket("wss://chatty.1337.cx/me/messages")

  ws.onmessage = function (e) {
    if (current_view === "room") {
      leave_room(current_chat)
    }
    let server_message = JSON.parse(e.data)
    add_li_to_privat_chat(server_message.user)
    store_chat_in_local_storage(server_message.user, server_message.user, server_message.message)
    activate_user_chat_window(server_message.user)
    format_message_in_chat(server_message.user)
    change_favicon(true)
    return
  }
}
