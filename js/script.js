document.cookie = "Session=test; SameSite=None; Secure";

const auth_api_url = "https://chatty.1337.cx/me/device_code";

function fetch_auth() {
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
  fetch("https://chatty.1337.cx/rooms", {
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