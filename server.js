const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { randomUUID } = require("crypto");
const { Chess } = require("chess.js");

require('dotenv').config()
const PORT = process.env.PORT;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let queue = [];
const games = {};
const playerRoom = {};
const playerColor = {};

function indexToSquare({ row, col }) {
  const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
  return files[col] + (8 - row);
}

function startGameTimer(roomId) {
  const game = games[roomId];
  game.timer = setInterval(() => {
    if (game.currentTurn === "w") {
      game.whiteTime--;
    } else {
      game.blackTime--;
    }

    io.to(roomId).emit("timer_update", {
      white_time: game.whiteTime,
      black_time: game.blackTime,
    });
    
    if (game.whiteTime <= 0 || game.blackTime <= 0) {
      clearInterval(game.timer);

      io.to(roomId).emit("game_over", {
        reason: "timeout",
      });
    }
  }, 1000);
}

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("enter_queue", () => {
    if (queue.includes(socket.id)) return;
    queue.push(socket.id);
    if (queue.length >= 2) {
      const player1 = queue.shift();
      const player2 = queue.shift();
      const roomId = randomUUID();
      const white = Math.random() < 0.5 ? player1 : player2;
      const black = white === player1 ? player2 : player1;

      games[roomId] = {
        chess: new Chess(),
        white,
        black,
        whiteTime: 300,
        blackTime: 300,
        move_array: [],
        currentTurn: "w",
        lastMoveTime: Date.now(),
        timer: null,
      };
     const game = games[roomId]
      io.to(white).emit("match_found", { roomId, color: "white",time:game.whiteTime});
      io.to(black).emit("match_found", { roomId, color: "black",time:game.blackTime});
    }
  });

  socket.on("join_game", ({ roomId, color }) => {
    const game = games[roomId];
    if (!game) return;

    socket.join(roomId);

    playerRoom[socket.id] = roomId;
    playerColor[socket.id] = color;

    socket.emit("game_state", {
      board: game.chess.board(),
      turn: game.chess.turn(),
      move_array: game.move_array,
      white_time: game.whiteTime,
      black_time: game.blackTime,
    });

    const players = io.sockets.adapter.rooms.get(roomId);

    if (players && players.size === 2) {
      startGameTimer(roomId,game.white,game.black);
    }
  });

  socket.on("make_move", ({ from, to }) => {
    const roomId = playerRoom[socket.id];
    if (!roomId) return;

    const game = games[roomId];
    if (!game) return;

    const chess = game.chess;

    const playerTurn = chess.turn() === "w" ? "white" : "black";

    if (playerColor[socket.id] !== playerTurn) return;

    try {
      let fromsq = indexToSquare(from);
      let tosq = indexToSquare(to);

      const move = chess.move({
        from: fromsq,
        to: tosq,
        promotion: "q",
      });

      if (!move) {
        socket.emit("illegal_move");
        return;
      }

      game.move_array.push(move.san);

      const now = Date.now();
      const elapsed = Math.floor((now - game.lastMoveTime) / 1000);

      if (game.currentTurn === "w") {
        game.whiteTime -= elapsed;
      } else {
        game.blackTime -= elapsed;
      }

      game.currentTurn = chess.turn();
      game.lastMoveTime = now;

      io.to(roomId).emit("move_made", {
        board: chess.board(),
        turn: chess.turn(),
        move_array: game.move_array,
        white_time: game.whiteTime,
        black_time: game.blackTime,
      });
    } catch (err) {
      socket.emit("illegal_move");
    }

    if (chess.isGameOver()) {
      clearInterval(game.timer);

      io.to(roomId).emit("game_over", {
        checkmate: chess.isCheckmate(),
        draw: chess.isDraw(),
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);

    queue = queue.filter((id) => id !== socket.id);

    const roomId = playerRoom[socket.id];

    if (roomId && games[roomId]) {
      clearInterval(games[roomId].timer);

      io.to(roomId).emit("opponent_disconnected");

      delete games[roomId];
    }

    delete playerRoom[socket.id];
    delete playerColor[socket.id];
  });
});

server.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});