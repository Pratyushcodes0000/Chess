const socket = io();
const squares = document.querySelectorAll(".square");
const color = sessionStorage.getItem("color") || "white";
const roomId = sessionStorage.getItem("roomId");
let white_time = 300;
let black_time = 300;


let board = Array(8).fill(null).map(()=>Array(8).fill(null));
let selected = null;
let currentTurn = "w";
let move_array;
let lastMove = null;
let pendingMove = null;
let gameOver = false;

const elTimeWhite = document.getElementById("timeWhite");
const elTimeBlack = document.getElementById("timeBlack");
const elClockWhite = document.getElementById("clockWhite");
const elClockBlack = document.getElementById("clockBlack");
const elStatusWhite = document.getElementById("statusWhite");
const elStatusBlack = document.getElementById("statusBlack");
const elMoveList = document.getElementById("moveList");
const elMovesSub = document.getElementById("movesSub");
const elFilesTop = document.getElementById("filesTop");
const elFilesBottom = document.getElementById("filesBottom");
const elRanksLeft = document.getElementById("ranksLeft");
const elRanksRight = document.getElementById("ranksRight");

//ensures if the value is a non negative integer
function safeSeconds(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

//converts seconds to mm:ss format
function fmtTime(totalSeconds) {
  const s = safeSeconds(totalSeconds, 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

//Updates the clock display, active player indicator, urgency styling, and page title.
function syncClocksUI() {
  if (elTimeWhite) elTimeWhite.textContent = fmtTime(white_time);
  if (elTimeBlack) elTimeBlack.textContent = fmtTime(black_time);

  const whiteActive = currentTurn === "w" && !gameOver;
  const blackActive = currentTurn === "b" && !gameOver;
  elClockWhite?.classList.toggle("active", whiteActive);
  elClockBlack?.classList.toggle("active", blackActive);

  const w = safeSeconds(white_time, 0);
  const b = safeSeconds(black_time, 0);
  const setUrgency = (elClock, seconds) => {
    elClock?.classList.toggle("low", seconds > 0 && seconds <= 30);
    elClock?.classList.toggle("critical", seconds > 0 && seconds <= 10);
  };
  setUrgency(elClockWhite, w);
  setUrgency(elClockBlack, b);

  const yourTurn = (color === "white" && currentTurn === "w") || (color === "black" && currentTurn === "b");
  if (!gameOver) {
    if (elStatusWhite) elStatusWhite.textContent = currentTurn === "w" ? "Thinking…" : "Waiting…";
    if (elStatusBlack) elStatusBlack.textContent = currentTurn === "b" ? "Thinking…" : "Waiting…";
  } else {
    if (elStatusWhite) elStatusWhite.textContent = "Game over";
    if (elStatusBlack) elStatusBlack.textContent = "Game over";
  }
  document.title = yourTurn ? "Your move — Chess" : "Chess";
}

//render the move list panel like:
// 1. e4   e5
// 2. Nf3  Nc6
// 3. Bb5  a6
function renderMoveHistory() {
  if (!elMoveList) return;
  const moves = Array.isArray(move_array) ? move_array : [];
  if (elMovesSub) elMovesSub.textContent = `${moves.length} plies`;

  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    const no = (i / 2) + 1;
    const w = moves[i] ?? "";
    const b = moves[i + 1] ?? "";
    rows.push({ no, w, b, isLast: i >= moves.length - 2 });
  }

  elMoveList.innerHTML = rows.map((r) => {
    const lastClass = r.isLast ? " last" : "";
    return `
      <div class="move-row${lastClass}">
        <div class="move-no">${r.no}.</div>
        <div class="move-san" title="${escapeHtml(String(r.w))}">${escapeHtml(String(r.w))}</div>
        <div class="move-san" title="${escapeHtml(String(r.b))}">${escapeHtml(String(r.b))}</div>
      </div>
    `;
  }).join("");

  // keep view scrolled to last move
  elMoveList.scrollTop = elMoveList.scrollHeight;
}

//prevents html injection
//withot this <script>alert()</script> could run
function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setCoordRow(el, labels) {
  if (!el) return;
  el.innerHTML = labels.map((v) => `<div class="coord-cell">${escapeHtml(String(v))}</div>`).join("");
}

function setCoordCol(el, labels) {
  if (!el) return;
  el.innerHTML = labels.map((v) => `<div class="coord-cell">${escapeHtml(String(v))}</div>`).join("");
}

function renderOuterCoords() {
  const files = (color === "white") ? ["a","b","c","d","e","f","g","h"] : ["h","g","f","e","d","c","b","a"];
  const ranks = (color === "white") ? ["8","7","6","5","4","3","2","1"] : ["1","2","3","4","5","6","7","8"];
  setCoordRow(elFilesTop, files);
  setCoordRow(elFilesBottom, files);
  setCoordCol(elRanksLeft, ranks);
  setCoordCol(elRanksRight, ranks);
}

//adds coordinate labels to squares.
function initSquareCoords() {
  squares.forEach((sq) => {
    
    if (!sq.querySelector(".coord.file")) {
      const f = document.createElement("span");
      f.className = "coord file";
      sq.appendChild(f);
    }
    if (!sq.querySelector(".coord.rank")) {
      const r = document.createElement("span");
      r.className = "coord rank";
      sq.appendChild(r);
    }
  });
}

socket.on("connect", () => {
  socket.emit("join_game", { roomId, color });
});

socket.on("timer_update",(data)=>{
 white_time = safeSeconds(data?.white_time, white_time);
 black_time = safeSeconds(data?.black_time, black_time);
 syncClocksUI();
})

socket.on("game_state", (data) => {
 updateBoard(data.board);
 currentTurn = data.turn;
 white_time = safeSeconds(data.white_time, white_time);
 black_time = safeSeconds(data.black_time, black_time);
 move_array = data.move_array;
 lastMove = null;
 gameOver = false;
 render();
 syncClocksUI();
 renderMoveHistory();
});

socket.on("move_made",(data)=>{
  updateBoard(data.board);
  currentTurn = data.turn;
  white_time = safeSeconds(data.white_time, white_time);
  black_time = safeSeconds(data.black_time, black_time);
  move_array = data.move_array;
 
  if (pendingMove) {
    lastMove = pendingMove;
    pendingMove = null;
  }
  selected = null;
  render();
  syncClocksUI();
  renderMoveHistory();
});

socket.on("illegal_move",()=>{
  showAlert("Illegal move")
  selected = null;
  pendingMove = null;
  render();
})

socket.on("game_over", (data) => {
  gameOver = true;
  syncClocksUI();
  const reason = data?.reason === "timeout"
    ? "Time out"
    : (data?.checkmate ? "Checkmate" : (data?.draw ? "Draw" : "Game over"));
  showAlert(reason);
});

socket.on("opponent_disconnected", () => {
  gameOver = true;
  syncClocksUI();
  showAlert("Opponent disconnected!! You won");
});

function gotohome(){
  window.location.href = "/"
}

//Flips board when player is black
function mapCoords(row, col) {
  if (color === "white") return { row, col };
  return {
    row: 7 - row,
    col: 7 - col
  };
}

//converts server chess.js board → UI board format
function updateBoard(chessBoard) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = chessBoard[row][col];

      if (!piece) {
        board[row][col] = "";
      } else {
        const pieceLetter = piece.type.toUpperCase();
        board[row][col] = piece.color + pieceLetter;
      }
    }
  }
}

function render() {
  squares.forEach((square, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    const coords = mapCoords(row, col);
    const piece = board[coords.row][coords.col];

    square.classList.remove("selected");
    square.classList.remove("last-move");

    if (
      selected &&
      selected.row === coords.row &&
      selected.col === coords.col
    ) {
      square.classList.add("selected");
    }

    square.style.backgroundImage =
      piece ? `url('/assets/${piece}.svg')` : "";

    // coordinate labels (relative to players view)
    const file = (color === "white" ? "abcdefgh" : "hgfedcba")[col];
    const rank = String(color === "white" ? (8 - row) : (row + 1));
    const fEl = square.querySelector(".coord.file");
    const rEl = square.querySelector(".coord.rank");
    if (fEl) fEl.textContent = (row === 7) ? file : "";
    if (rEl) rEl.textContent = (col === 0) ? rank : "";

    if (
      lastMove &&
      ((lastMove.from.row === coords.row && lastMove.from.col === coords.col) ||
       (lastMove.to.row === coords.row && lastMove.to.col === coords.col))
    ) {
      square.classList.add("last-move");
    }
  });
}

initSquareCoords();
renderOuterCoords();
render();
syncClocksUI();

squares.forEach((square, index) => {
  square.addEventListener("click", () => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    const coords = mapCoords(row, col);
    handleClick(coords.row, coords.col);
  });
});

function handleClick(row, col) {
  if (gameOver) return;

  if (
    (color === "white" && currentTurn !== "w") ||
    (color === "black" && currentTurn !== "b")
  ) return;

  const piece = board[row][col];

  if (selected === null) {
    if (!piece) return;

    if (color === "white" && piece[0] !== "w") return;
    if (color === "black" && piece[0] !== "b") return;

    selected = { row, col };
    render();
    return;
  }

  if (selected.row === row && selected.col === col) {
    selected = null;
    render();
    return;
  }

   if (piece && ((color === "white" && piece[0] === "w") || (color === "black" && piece[0] === "b"))) {
    selected = { row, col };
    render();
    return;
  }

  const from = { ...selected };
  const to = { row, col };

  pendingMove = { from, to };
  socket.emit("make_move", { from, to });
}



