const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn= document.getElementById("mute");
const CameraBtn= document.getElementById("camera");
const camerasSeclect = document.getElementById("cameras");

const call= document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

const getCameras = async() => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");
    const currCamera = myStream.getVideoTracks()[0];
    cameras.forEach(camera => {
      const option = document.createElement('option');
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if(currCamera.label === camera.label){
        option.selected = true;
      }
      camerasSeclect.appendChild(option);
    })
  } catch (e ) {
    console.log(e);
  }
}

const getMedia = async(devideId) => {
  const initialConstrains = {
    audio: true,
    video: {facingMode: "user"}
  }
  const cameraConstrains = {
    audio: true,
    video: {devideId: {exact: devideId }}
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      devideId ? cameraConstrains : initialConstrains
    );
    myFace.srcObject = myStream;
    if(!devideId){
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

const handleMuteClick = () => {
  console.log(myStream.getAudioTracks());
  myStream.getAudioTracks().forEach((track) => track.enabled = !track.enabled);
  if(!muted){
    muteBtn.innerText = "Unmute";
    muted = true;
  }else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}

const handleCameraClick = () => {
  console.log(myStream.getVideoTracks());
  myStream.getVideoTracks().forEach((track) => track.enabled = !track.enabled);
  if(cameraOff){
    CameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  }else {
    CameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

const handleCameraChange = async() => {
  await getMedia(camerasSeclect.value);
  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === 'video');
    videoSender.replaceTrack(videoTrack)

  }
}

muteBtn.addEventListener("click",handleMuteClick);
CameraBtn.addEventListener("click",handleCameraClick);
camerasSeclect.addEventListener("click",handleCameraChange);


const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

const initCall = async() => {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

const handleWelcomeSubmit = async(e) => {
  e.preventDefault();
  const input = welcomeForm.querySelector("input");
  await initCall();
  socket.emit("join_room",input.value);
  roomName = input.value;
  input.value="";
}

welcomeForm.addEventListener("submit",handleWelcomeSubmit);

//Socket code
socket.on("welcome", async() => {
  myDataChannel = myPeerConnection.createDataChannel("chat");
  myDataChannel.addEventListener("message",console.log)
  console.log("made data channel");
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  console.log("Send the offer")
  socket.emit("offer",offer,roomName);
})

socket.on("offer", async(offer) => {
  myPeerConnection.addEventListener("datachannel", (e) => {
    myDataChannel = e.channel;
    myDataChannel.addEventListener("message",(e) => console.log(e.data))
  });
  console.log("Receive the offer")
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer,roomName);
  console.log("Send the answer");
})

socket.on("answer",answer => {
  console.log("Receive the answer");
  myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice",(ice) => {
  console.log("Receive candidate")
  myPeerConnection.addIceCandidate();
})

//RTC Code

const makeConnection = () => {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls:[
          "stun: stun.l.google.com:19302",
          "stun: stun1.l.google.com:19302",
          "stun: stun2.l.google.com:19302",
          "stun: stun3.l.google.com:19302",
          "stun: stun4.l.google.com:19302",
        ]
      }
    ]
  });
  myPeerConnection.addEventListener("icecandidate",handleIce);
  myPeerConnection.addEventListener("addstream",handleAddStream);
  myStream.getTracks().forEach(track => myPeerConnection.addTrack(track,myStream));
}

const handleAddStream = (data) => {
  const peerFace = document.getElementById("peerFace")
  peerFace.srcObject = data.stream;
}

const handleIce = (data) => {
  console.log("Sent candidate")
  socket.emit("ice",data.candidate,roomName);
}