
/**
 *
 *  Project A Small Traffic
 *  Just gonna refresh my shits on NodeJS
 *
 *  Start Date: Wednesday, Oct. 1, 2014 @ 9:45PM +8GMT
 *
 *  Copyright (c) kearlsaint@gmail.com 2014
 *
 *  Disclaimer Notes:
 *      If you want the source code, please check
 *    my github at http://github.com/kearlsaint
 *    Sometimes I release my source codes :)
 *
 *    Thank you!
 *
**/

"use strict"; // ECMA Strict Mode

var socket = io.connect(self.location.origin);
var room   = undefined;

// latency
// thanks to http://stackoverflow.com/a/22405861
var ping = function(){
	var start = Date.now();
	socket.emit("ping", function(){
		var time = (Date.now() - start);
		//console.log("Ping: " + (Date.now() - start) + "ms");
		document.getElementById("Ping").innerHTML = time + "ms";
		setTimeout(ping, 2000);
	});
};
ping();

socket.on("info", function(text){
	// new info
	var container = document.getElementById("Highway");
	var info = document.createElement("div");
	info.className = "info";
	info.innerHTML = text;
	container.appendChild(info);
	container.scrollTop = container.scrollHeight;
});

socket.on("text", function(text, name){
	// new text
	var container = document.getElementById("Highway");
	var bubble = document.createElement("div");
	bubble.className = "bubble2Container";
	bubble.innerHTML = "<section class='bubble2'><h6>"+name+"</h6><p>"+text+"</p></section>";
	container.appendChild(bubble);
	container.scrollTop = container.scrollHeight;
});

socket.on("update", function(rooms){
	// new room list
	var container = document.getElementById("RoomList");
	container.innerHTML = "";
	for(var i=0, button; i<rooms.length; i++){
		button = document.createElement("button");
		button.setAttribute("data-roomname", rooms[i]);
		button.setAttribute("onclick", "changeRoom(this); return false");
		button.innerHTML = rooms[i];
		container.appendChild(button);
	};
	highlightRoom();
});

socket.on("hosted", function(room){
	// successfully hosted a room
	hideMakeRoom();
});

socket.on("error", function(err){
	if(typeof(err)==="string"){
		document.getElementById("ErrorText").innerHTML = err;
		showError();
	}else{
		console.log(err);
	}
});

socket.on("joined", function(roomname){
	highlightRoom(roomname);
	highlightTextInput();
});

var highlightTextInput = function(){
	document.getElementById("TextInput").focus();
};
var changeRoom = function(element){
	var roomname = element.getAttribute("data-roomname");
	socket.emit("join", roomname);
};
var makeRoom = function(){
	document.getElementById("RoomMaker").className = "shown";
	document.getElementById("RoomName").focus();
};
var hideMakeRoom = function(){
	document.getElementById("RoomMaker").className = "";
	highlightTextInput();
};
var highlightRoom = function(roomname){
	if(roomname){
		room = roomname;
	}
	var tmp = document.querySelectorAll("#RoomList>button");
	for(var i=0; i<tmp.length; i++){
		tmp[i].className = "";
	}
	try{
		var el = document.querySelectorAll("#RoomList>button[data-roomname=\""+room+"\"]")[0];
		el.className = "active";
	}catch(e){};
};
var createRoom = function(){
	var name = document.getElementById("RoomName").value;
	var privacy = (document.getElementById("RoomPrivacy").checked===true?1:0);
	if(checkRoomName() === true){
		socket.emit("host", name, privacy);
	}
};
var checkRoomName = function(e){
	if(e && window.event && window.event.keyCode){
		if(window.event.keyCode === 13){
			createRoom();
			return;
		}
	}
	var button = document.getElementById("RoomHostButton");
	if(document.getElementById("RoomName").value.length >= 4){
		button.className = "okay";
		return true;
	}else{
		button.className = "";
	}
};
var checkPrivateRoom = function(e){
	if(e && window.event && window.event.keyCode){
		if(window.event.keyCode === 13){
			joinPrivateRoom();
			return;
		}
	}
	var button = document.querySelectorAll("#JoinContainer>button")[0];
	if(document.getElementById("PrivateRoom").value.length >= 4){
		button.className = "okay";
		return true;
	}else{
		button.className = "";
		return false;
	}
};
var joinPrivateRoom = function(){
	if(checkPrivateRoom() === true){
		socket.emit("join", document.getElementById("PrivateRoom").value);
	}
};
var showError = function(){
	document.getElementById("Error").className = "shown";
};
var hideError = function(){
	document.getElementById("Error").className = "";
};
var checkMessage = function(e){
	if(e && window.event && window.event.keyCode){
		if(window.event.keyCode === 13){
			sendMessage();
			return;
		}
	}
	var button = document.querySelectorAll("#TextInputContainer>button")[0];
	if(document.getElementById("TextInput").value.length >= 2){
		button.className = "okay";
		return true;
	}else{
		button.className = "";
		return false;
	}
};
var sendMessage = function(){
	if(checkMessage() === true){
		var text = document.getElementById("TextInput").value;
		var container = document.getElementById("Highway");
		var bubble = document.createElement("div");
		document.getElementById("TextInput").value = "";
		bubble.className = "bubbleContainer";
		bubble.innerHTML = "<section class='bubble'><p>"+text+"</p></section>";
		container.appendChild(bubble);
		socket.emit("text", text);
		container.scrollTop = container.scrollHeight;
		checkMessage();
		highlightTextInput();
	}
};
var showMenu = function(){
	var left  = document.getElementById("Left");
	var right = document.getElementById("Right");
	left.className = "shown";
	right.className = "hidden";
	setTimeout(function(){
		var temp = function(e){
			left.className = "";
			right.className = "";
			right.removeEventListener("click", temp);
		};
		right.addEventListener("click", temp);
	}, 200);
};


// this will make a random retro box-like pixelized awesumshit
var retro = function(){
	var context = document.createElement("canvas").getContext("2d");
	var colors = ["#ebebeb", "#ffebee", "#f3e5f5", "#e3f2fd", "#e0f2f1", "#f9fbe7", "#fffde7", "#fff3e0", "#fbe9e7"];
	context.canvas.width  = window.innerWidth;
	context.canvas.height = window.innerHeight;
	context.fillStyle = colors[0];
	context.fillRect(0, 0, window.innerWidth, window.innerHeight);
	for(var shapes = 0; shapes < 300+Math.round(Math.random()*200); shapes++){
		var shapeW = 8 * Math.floor(Math.random()*32);
		var shapeH = 8 * Math.floor(Math.random()*32);
		var shapeX = -100 + Math.ceil(Math.random() * window.innerWidth);
		var shapeY = -100 + Math.ceil(Math.random() * window.innerHeight);
		context.fillStyle = colors[Math.floor(Math.random()*colors.length)];
		context.fillRect(shapeX, shapeY, shapeW, shapeH);
	}
	return context.canvas;
};
var astbg = new Image;
astbg.src = retro().toDataURL();
document.getElementById("ASTBG").appendChild(astbg);
highlightTextInput();
FastClick.attach(document.getElementById("AST"));