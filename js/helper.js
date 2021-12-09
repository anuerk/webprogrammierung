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
