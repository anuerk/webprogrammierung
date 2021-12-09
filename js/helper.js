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

function show_loading(show, text) {
  if (show === true) {
    document.getElementById("overlay").style.display = "block"
    document.getElementById("container").style.display = "none"

    if (typeof (text) !== undefined) {
      let spinner = document.createElement("div")
      spinner.classList.add('loading_spinner')
      if (current_user) {
        document.getElementById("login_info").innerHTML = '<p>site is loading...</p>' //labels.loading
        document.getElementById("login_info").append(spinner)
      }
    }
  } else {
    document.getElementById("container").style.display = "flex"
    document.getElementById("overlay").style.display = "none";
  }
}