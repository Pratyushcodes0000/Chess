const socket = io()
let isloading = false;
const loadingOverlay = document.getElementById("loadingOverlay");


socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

const enter_queue=()=>{
  isloading = true;
  if(isloading)showloading();
  socket.emit("enter_queue")
  isloading = true
}

socket.on("match_found", (data) => {
  sessionStorage.setItem("roomId",data.roomId);
  sessionStorage.setItem("color",data.color)
  sessionStorage.setItem("time",data.time)
  isloading = false;
  hideloading();
  window.location.href = "html/game.html"
});

function showloading(){
console.log("SHOWING OVERLAY");
loadingOverlay.classList.remove("hidden");
}

function hideloading(){
loadingOverlay.classList.add("hidden");
}