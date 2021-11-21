document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code"
const get_rooms_api_url = "https://chatty.1337.cx/rooms"

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
    .then((data) => {
      console.log(data);
    });
}

function get_rooms() {
  fetch(get_rooms_api_url, {
    credentials: "include",
  })
    .then((res) => {
      console.log(res);
      return res.json();
    })
    .then((data) => {
      console.log(data);
    });
}