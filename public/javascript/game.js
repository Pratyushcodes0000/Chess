const socket = io();
const squares = document.querySelectorAll(".square");
const color = sessionStorage.getItem("color") || "white";
const roomId = sessionStorage.getItem("roomId");

let board = Array(8).fill(null).map(()=>Array(8).fill(null));
let selected = null;
let currentTurn = "w";

socket.on("connect", () => {
  socket.emit("join_game", { roomId, color });
});
socket.on("game_state", (data) => {
 updateBoard(data.board);
 currentTurn = data.turn;
 render();
});

socket.on("move_made",(data)=>{
  updateBoard(data.board);
  currentTurn = data.turn;
  selected = null;
  render();
});

socket.on("Illegal_move",()=>{
  showAlert("Illegal move")
  selected = null;
})

function mapCoords(row, col) {
  if (color === "white") return { row, col };
  return {
    row: 7 - row,
    col: 7 - col
  };
}


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

    if (
      selected &&
      selected.row === coords.row &&
      selected.col === coords.col
    ) {
      square.classList.add("selected");
    }

    square.style.backgroundImage =
      piece ? `url('/assets/${piece}.svg')` : "";
  });
}

render();

squares.forEach((square, index) => {
  square.addEventListener("click", () => {
    const row = Math.floor(index / 8);
    const col = index % 8;

    const coords = mapCoords(row, col);
    handleClick(coords.row, coords.col);
  });
});

function handleClick(row, col) {
  console.log("Clicked");

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

  socket.emit("make_move", { from, to });
  console.log("move sent to server");
}



