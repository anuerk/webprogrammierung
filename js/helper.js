function addslashes(str) {
  //helper to make json valid
  return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0')
}

function show_loading(show, text) {
  if (show === true) {
    document.getElementById("overlay").style.display = "block"
    document.getElementById("container").style.display = "none"

    if (typeof (text) !== undefined) {
      let spinner = document.createElement("div")
      spinner.classList.add("loading_spinner")
      document.getElementById("login_info").innerHTML = "<p>Site is loading</p>"
      document.getElementById("login_info").append(spinner)

    }
  } else {
    document.getElementById("container").style.display = "flex"
    document.getElementById("overlay").style.display = "none";
  }
}

function loading_error() {
  document.getElementById("overlay").style.display = "block"
  document.getElementById("container").style.display = "none"
  document.getElementById("login_info").innerHTML = "<p>" + labels.bad_error + "</p>"
}

// change favicon when user is not active in tab but there are new notifications
function change_favicon(notify) {
  var link = document.querySelector("link[rel~='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.getElementsByTagName('head')[0].appendChild(link)
  }
  if (notify) {
    link.href = 'img/notify.ico'
  } else {
    link.href = 'img/favicon.ico'
  }
}

window.onfocus = function() {
  // here can be more infos added 
  change_favicon(false) 
};
