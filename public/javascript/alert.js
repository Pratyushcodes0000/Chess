const overlay = document.getElementById("alert-overlay");
const messageBox = document.getElementById("alert-message");
const closeBtn = document.getElementById("alert-close");

 function showAlert(message) {
  messageBox.textContent = message;
  overlay.classList.remove("hidden");
}

 function hideAlert() {
  overlay.classList.add("hidden");
}

closeBtn.addEventListener("click", hideAlert);

// Optional: close when clicking outside box
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) {
    hideAlert();
  }
});

