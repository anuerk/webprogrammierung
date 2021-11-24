document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"
const get_users_api_url = "https://chatty.1337.cx/users"
const join_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/users
const delete_room_api_url = "https://chatty.1337.cx/rooms/" //{room_name/users

const label_users = "users"
const label_rooms = "rooms"
const label_add = "add"

let current_room = ""

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
  document.getElementById('rooms').innerHTML = label_rooms
  let ul = document.createElement('ul');

  fetch(get_rooms_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('da')
      console.log(data)

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

      return
    })
    .catch(function (error) {
      console.log(error);
    })
    .finally(() => {
      console.log("finally");
      let li = document.createElement("li");
      let btn = document.createElement("button")
      btn.innerHTML = label_add
      btn.value = label_add
      //todo net nur klick
      btn.addEventListener("click", create_room)
      btn.classList.add("fas", "fa-plus");

      li.appendChild(btn)
      ul.appendChild(li)

      document.getElementById('rooms').append(ul)
    });
  /*.finally(function (error) {
    
  });

<div class="add_room">
  <i class="">add</i>
</div>*/

}

function get_users() {
  document.getElementById('users').innerHTML = label_users;

  fetch(get_users_api_url, {
    credentials: "include",
  })
    .then((resp) => resp.json())
    .then(function (data) {
      console.log('get_users')

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

// wird aufgerufen bei room-button click
function enter_room() {
  console.log('enter room')

  // todo fetch blabla
  let room = this.value
  let enter_fetch_url = join_room_api_url + room + '/users'
  let delete_fetch_url = delete_room_api_url + localStorage.getItem("current_room") + '/users'



  console.log(delete_fetch_url + room + '/users')

  //todo braucht man doch eigentlich kein local storage
  if (localStorage.getItem("current_room") == room) {
    alert("You are already in the room " + room)
  }
  else {
    // leave current room todo evtl. auslafgern als funktion
    console.log('1 raum verlassen')
    fetch(delete_fetch_url, {
      method: 'delete',
      credentials: "include",
    })
      .then(function (resp) {
        console.log("left room " + room)

        if (resp.status = 409) {
          alert("you left the room " + localStorage.getItem("current_room"))
        } else if (resp.status = 404) {
          alert("You are not in the room " + room)
        }

        // enter new room
        fetch(enter_fetch_url, {
          method: 'POST',
          credentials: "include",
        })
          .then(function (resp) {
            current_room = "room"
            localStorage.setItem("current_room", room);
            console.log("zeile 133")
            console.log(resp)
            console.log(resp.status)

            if (resp.status = 200) {
              alert("you joined the room " + room)
              //todo leave room - sollte bald nicht mehr passieren
            } else if (resp.status = 201) {
              alert("You created and joinend in the room " + room)
            }
            else if (resp.status = 404) {
              alert("You are not in the room " + room)
            }

            return
          })
          .catch(function (error) {
            console.log(error);
          });
        return
      })
      .catch(function (error) {
        console.log(error);
      });

    console.log('2 raum betreten')

  }
}

function create_room() {
  console.log('create room')

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
      console.log('create room ')
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