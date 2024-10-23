import express from "express";
import http from "http"
import SocketIo from "socket.io"

const app = express();
const path = require('path');

app.set("view engine", "pug");
app.set("views",path.join(__dirname,"views"));

app.use(express.static(path.join(__dirname,'public')));

app.get("/", (req, res) => res.render("home"));

app.get("/*", (req, res) => res.redirect("/"));

const server = http.createServer(app);
const io = SocketIo(server)

io.on("connection",(socket) => {
  socket.on("join_room",(roomName) => {
    socket.join(roomName);
    socket.to(roomName).emit("welcome");
  })
  socket.on("offer",(offer,roomName) => {
    socket.to(roomName).emit("offer",offer);
  })
  socket.on("answer",(answer,roomName) => {
    socket.to(roomName).emit("answer",answer);
  })
  socket.on("ice",(ice,roomName)=> {
    socket.to(roomName).emit("ice",ice);
  })
})

const handleListen = () => {console.log("Listen on 3000")}
server.listen(3000,handleListen);