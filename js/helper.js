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
  if (notify && document.visibilityState !== "visible") {
    link.href = 'img/notify.ico'
  } else {
    link.href = 'img/favicon.ico'
  }
}

window.onfocus = function () {
  // here can be more infos added 
  change_favicon(false)
}

observer = new MutationObserver(function(mutations) {
  if (document.contains(document.contains(document.getElementsByClassName("room_container")[0]))) {
       console.log("It's in the DOM!")
       //observer.disconnect()
   }
   else{
     console.log('asdas')
   }
})

// not used :(
const resize_ob = new ResizeObserver(function(entries) {
	// since we are observing only a single element, so we access the first element in entries array
	let rect = entries[0].contentRect;

	// current width & height
	let width = rect.width;
	let height = rect.height;

	console.log('Current Width : ' + width);
	console.log('Current Height : ' + height);
});

function scroll_to_end(){
  if(current_view === "room"){
    document.getElementsByClassName("room_container")[0].scrollTop = document.getElementsByClassName("room_container")[0].scrollHeight
  }
  else{
    document.getElementsByClassName("user_chat_container")[0].scrollTop = document.getElementsByClassName("user_chat_container")[0].scrollHeight

  }
}