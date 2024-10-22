import express from "express";
import http from "http"
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

const app = express();
const path = require('path');

app.set("view engine", "pug");
app.set("views",path.join(__dirname,"views"));

app.use(express.static(path.join(__dirname,'public')));

app.get("/", (req, res) => res.render("home"));

app.get("/*", (req, res) => res.redirect("/"));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
  transports: ["websocket"], // Force WebSocket connection
});

instrument(io, {
  auth: false,
  mode: "development"
});

const publicRooms = () => {
  const {sids,rooms} = io.sockets.adapter;
  const publicRooms = [];
  rooms.forEach((value,key) => {
    if(sids.get(key) === undefined){
      publicRooms.push(key);
    }
  })
  return publicRooms;
}

const countRoom = (roomName) => {
  return io.sockets.adapter.rooms.get(roomName)?.size;
}

io.on("connection", (socket) => {
  socket["nickname"] = "Anonymous";
  socket.onAny((e) => {
    console.log(io.sockets.adapter);
    console.log(`Socket Event: ${e}`);
  })
  socket.on("enter_room", (roomName,done) => {
    socket.join(roomName);
    done();
    socket.to(roomName).emit("welcome",socket.nickname,countRoom(roomName));

    io.sockets.emit("room_change",publicRooms());
  })
  socket.on("disconnecting", () => {
    socket.rooms.forEach(room => socket.to(room).emit("bye",socket.nickname,countRoom(room)-1));
  })
  socket.on("disconnect",() => {
    io.sockets.emit("room_change",publicRooms());
  })
  socket.on("new_message",(msg,room  ,done) => {
    socket.to(room).emit("new_message",`${socket.nickname}: ${msg}`);
    done();
  })
  socket.on("nickname",(nickname) => {
    socket["nickname"] = nickname;
  })
})

server.listen(3000);

 