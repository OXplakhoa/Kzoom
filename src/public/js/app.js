const socket = io();
const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;
let userName;

const addMessage = (msg) => {
  const ul = room.querySelector("ul");
  const li = document.createElement("li");
  li.innerText = msg;
  ul.append(li);
}

const handleMsgSubmit = (e) => {
  e.preventDefault();
  const input = room.querySelector("#msg input");
  const value = input.value;
  socket.emit("new_message", value, roomName, () => {
    addMessage(`You: ${value}`);
  });
  input.value = "";
}

const handleNameSubmit = (e) => {
  e.preventDefault();
  const input = welcome.querySelector("#userName");
  userName = input.value; 
  socket.emit("nickname", userName);
}

const showRoom = () => {
  welcome.hidden = true;
  room.hidden = false;
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName}`;
  const msgForm = room.querySelector("#msg");
  msgForm.addEventListener("submit", handleMsgSubmit);
}

const handleRoomSubmit = (e) => {
  e.preventDefault();
  const input = form.querySelector("#roomName");
  roomName = input.value; 
  socket.emit("enter_room", roomName, showRoom);
  input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);
welcome.querySelector("#userName").addEventListener("blur", handleNameSubmit); 

socket.on("welcome", (user,newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} joined!`);
});

socket.on("bye", (user,newCount) => {
  const h3 = room.querySelector("h3");
  h3.innerText = `Room ${roomName} (${newCount})`;
  addMessage(`${user} left!`);
});

socket.on("new_message", (msg) => {
  addMessage(msg);
});

socket.on("room_change",(rooms) => {
  const roomList = welcome.querySelector("ul");
  roomList.innerHTML = "";
  if (rooms.length === 0){
    return;  
  }
  rooms.forEach(room => {
    const li = document.createElement("li");
    li.innerText = room;
    roomList.append(li);
  })
})
