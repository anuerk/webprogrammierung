document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"
const get_users_api_url = "https://chatty.1337.cx/users"

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
      console.log(error)
    });
}

function get_rooms() {
  fetch(get_rooms_api_url, {
    credentials: "include",
  })
    .then((res) => {
      console.log(res);
      add_rooms_to_div(res.json())
      return res.json();
    })
    .catch((error) => {
      console.log(error)
    });


}

function get_users() {
  fetch(get_users_api_url, {
    credentials: "include",
  })
    .then((res) => {
      console.log(res);
      return res.json();
    })
    .catch((error) => {
      console.log(error)
    });


}