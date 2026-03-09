# Real-Time Opensource Multiplayer Chess

A real-time multiplayer chess game built using **Node.js**, **Express**, and **Socket.IO**.
Players can join matchmaking, get paired automatically, and play a full chess match with timers and move history.

This project demonstrates **real-time communication, game state synchronization, and multiplayer game logic**.

---

#  Features

*  Real-time multiplayer gameplay
*  Player timers
*  Move history tracking
*  Automatic matchmaking
*  Last move highlighting
*  Board orientation based on player color
*  Handles opponent disconnects

---

#  Tech Stack

* **Node.js**
* **Express.js**
* **Socket.IO**
* **Chess.js**
* **Vanilla JavaScript**
* **HTML / CSS**

---

#  Project Structure

```
public/
│
├── assets/        # Chess piece SVGs
├── html/          # Game pages
│   └── game.html
│
├── javascript/    # Client-side scripts
│   ├── game.js
│   ├── script.js
│   └── alert.js
│
├── style/         # CSS styles
│
└── index.html     # Landing page

server.js          # Main backend server
```

---

#  Running the Game Locally

### 1️ Clone the repository

```
git clone <your-repository-url>
cd <repository-folder>
```

### 2️ Install dependencies

```
npm install
```

### 3️ Start the server

```
node server.js
```

The server runs on:

```
http://localhost:8000
```

You can change the port inside `server.js` if needed.

### 4️ Open two browser tabs

Open:

```
http://localhost:8000
```

in **two separate tabs or windows**.

### 5️ Enter matchmaking

Click **"Play Now"** on both pages.

The server will automatically match the players into a game room.

### 6️ Play!

Enjoy your chess match ♟️

---

#  Gameplay

* White moves first
* Timers count down for each player
* Moves are validated using **Chess.js**
* Move history is displayed during the game
* Game ends on:

  * Checkmate
  * Draw
  * Timeout
  * Opponent disconnect

---

#  Future Improvements

Possible features to add:

* Legal move highlighting
* Pawn promotion UI
* Sound effects
* Spectator mode
* Game replay system
* Player accounts
* Game database
* Stockfish engine analysis

---

# License

This project is open-source and available under the **MIT License**.

---

#  Author

Built as a learning project to explore **real-time systems and multiplayer game architecture using Node.js and WebSockets**.
