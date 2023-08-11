/**
 *
 * A Small Traffic
 *
 * (c) kearlsaint@gmail.com 2014
 *
**/

// setup
var express = require("express");
var http = require("http");
var app = express();
var server = app.listen(process.env.PORT||8080);
var io = require("socket.io").listen(server);
var sanitize = require("./htmlcleaner.js");
var html_sanitize = sanitize.html_sanitize;

//GLOBAL.Parse = require('parse').Parse;
//Parse.initialize("qKG6hCfY4rjZ5El5bjGvVEMCgJoDtJIgqC8NN06o", "BTqy4LzVo2HyH2lIzjtYQWWKWuKLCfLO0VIdXHWf");

// serve static files using express
app.use("/", express.static(__dirname));
app.use(function(req, res, next){
	res.header('Access-Control-Allow-Origin', req.headers.origin || "*");
	res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,HEAD,DELETE,OPTIONS');
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
});

var users = 0;
var index = 0;
var rooms = ["Superhighway"];  // public rooms
var rooms_ = ["Superhighway"]; // complete list of rooms
var names = ["kearl", "kearlsaint", "kearl saint", "ksaint", "kearlsaint@gmail.com"];

function urlX(url){
	if(/^https?:\/\//.test(url)){
		return url
	}
}

function idX(id){
	return id
}

var Abbey = function(socket){
	this.socket = socket;
};

Abbey.prototype.respond = function(text, time){
	if(!time) time = 0;
	var socket = this.socket;
	setTimeout(function(t){
		socket.emit("text", text, "Abbey");
	}, time);
};

Abbey.prototype.wait = function(type, bool, fn){
	var self   = this;
	var socket = this.socket;
	this[bool] = false;
	socket.on(type, function(response){
		fn.call(self, response);
	});
};

io.sockets.on("connection", function(socket){
	
	// new user!
	users++;
	index++;
	var hostname = undefined;
	var roomname = "Superhighway";
	var hostPrivacy = 0;
	var abbey = new Abbey(socket);
	console.log("!! new user connected");
	
	var name = "EndUser"+index.toString();
	names.push(name);
	
	var leave = function(){
		if(hostname!==undefined && hostname!=="Superhighway"){
			// leave the room
			socket.leave(hostname);
			socket.broadcast.to(hostname).emit("info", "The creator " + name + " left.");
			socket.emit("info", "You have left the conversation.");
			// remove the room
			var i = rooms.indexOf(hostname);
			var j = rooms_.indexOf(hostname);
			if(i > -1) rooms.splice(i, 1);
			if(j > -1) rooms_.splice(j, 1);
		}else if(roomname!==undefined){
			// leave the room
			socket.leave(roomname);
			socket.broadcast.to(roomname).emit("info", name + " left the conversation.");
		}
		io.sockets.emit("update", rooms);
	};
	
	socket.on("ping", function(fn){fn();});
	
	socket.on("leave", function(){
		users--;
		names.splice(names.indexOf(name), 1);
		console.log("!! "+name+" disconnected");
		leave();
	});
	
	socket.on("disconnect", function(){
		users--;
		names.splice(names.indexOf(name), 1);
		console.log("!! "+name+" disconnected");
		leave();
	});
	
	socket.on("host", function(rname, privacy){
		// sanitize
		rname = html_sanitize(rname);
		// check if it is still the same name
		if(rname === hostname || rname === roomname) return;
		// check if it already exists
		if(rooms_.indexOf(rname) > -1){
			socket.emit("error", "Conversation name already exists!");
			return;
		}
		// check room name
		if(rname.length < 4){
			socket.emit("error", "Please make the conversation name more meaningful.");
			return;
		}
		// leave any existing rooms
		leave();
		// create as a host
		hostname = rname;
		roomname = rname;
		socket.join(hostname);
		socket.emit("hosted", hostname);
		socket.emit("joined", hostname);
		socket.emit("info", "Conversation " + hostname + " is now hosted by you.");
		// check privacy
		// if public add to rooms list
		// else only the invited can join
		rooms_.push(hostname);
		if(privacy === 0){
			rooms.push(hostname);
			io.sockets.emit("update", rooms);
		}
	});
	
	socket.on("join", function(newroom){
		// check the length
		if(newroom.length < 4) return;
		// change if he joins the same room
		if(newroom === roomname || newroom === hostname) return;
		// check if it exists
		var i = rooms_.indexOf(newroom);
		if(i > -1){
			// it exists
			leave();
			hostname = undefined;
			roomname = newroom;
			socket.broadcast.to(roomname).emit("info", name + " has joined the conversation.");
			socket.join(roomname);
			socket.emit("joined", roomname);
			socket.emit("info", "You have joined " + roomname);
		}else{
			// it doesn't exists
			socket.emit("error", "The conversation doesn't exist!");
		}
	});
	
	
	socket.on("changename", function(newname){
		// sanitize
		newname = html_sanitize(newname);
		if(newname.length < 4){
			socket.emit("error", "Please make your nickname have atleast 4 letters.");
			return;
		}
		if(names.indexOf(newname.toLowerCase()) > -1){
			socket.emit("error", "That username has already been taken!");
			return;
		}
		var oldname = name;
		name = newname;
		names.splice(names.indexOf(oldname), 1);
		names.push(newname);
		socket.broadcast.to(roomname).emit("info", oldname + " changed his name to " + newname);
		socket.emit("info", "Your nickname has been changed from " + oldname + " to " + newname);
	});
	
	// moved to abbey{}
	/*socket.on("text", function(text){
		if(text.length < 2){
			socket.emit("info", "Please don't spam.");
			return;
		}
		if(hostname !== undefined){
			socket.broadcast.to(hostname).emit("text", text, name);
		}else{
			socket.broadcast.to(roomname).emit("text", text, name);
		}
		//io.sockets.in(roomname).emit("text", text, name);
	});*/
	
	socket.on("update", function(){
		socket.emit("update", rooms);
	});
	
	// initially give a list of rooms
	socket.emit("update", rooms);
	
	// join in the superhighway
	socket.join(roomname);
	socket.emit("joined", roomname);
	abbey.respond("Welcome to the Superhighway!<br/><a href='#' onclick='socket.emit(\"help\")'>The what?</a>");
	socket.on("help", function(){
		abbey.respond("It's the main conversation group of A Small Traffic.");
		abbey.respond("Oh yeah, I'm Abbey. I'll be your host here.", 3000);
		abbey.respond("This here is the main public highway for all incoming and outgoing feeds.", 7000);
		abbey.respond("Feel free to talk here. You can also create your own conversation feed for your friends to connect to!", 13000);
		abbey.respond("PS: I'm just a bot.", 20000);
		abbey.respond('Your current nickname is <b>' + name + '</b>.<br/>Do you want to change it? <a href="#" onclick="socket.emit(\'wanttochangename\')">Yup.</a> &middot; <a href="#" onclick="socket.emit(\'dontwanttochangename\')">Nope</a>', 25000);
	});
	socket.on("dontwanttochangename", function(){
		abbey.respond("Okay..");
		abbey.respond("If you do change your mind, you can always type in<br><i>I want to change my name</i><br><i>I want a new name</i><br><i>Please change my name</i><br><i>Change my name</i>", 3000);
		//abbey.respond("If you need me, just call me ;)", 5000);
	});
	socket.on("wanttochangename", function(){
		abbey.respond("What would you like your nickname to be?");
		abbey.needsNewName = true;
	});
	abbey.wait("text", "needsNewName", function(response){
		if(
			response.toLowerCase() === "i want to change my name" ||
			response.toLowerCase() === "i want a new name" ||
			response.toLowerCase() === "please change my name" ||
			response.toLowerCase() === "change my name please" ||
			response.toLowerCase() === "change my name" ||
			response.toLowerCase() === "can you change my name"){
			this.needsNewName = true;
			abbey.respond("What would you like your nickname to be?");
			return;
		}
		if(this.needsNewName === false){
			// clean
			response = html_sanitize(response);
			if(response.length < 2){
				socket.emit("info", "Please don't spam.");
				return;
			}
			if(hostname !== undefined){
				socket.broadcast.to(hostname).emit("text", response, name);
			}else{
				socket.broadcast.to(roomname).emit("text", response, name);
			}
			return;
		}
		if(!this.waitingConfirmation) this.waitingConfirmation = false;
		if(this.waitingConfirmation === false){
			// clean
			response = html_sanitize(response, urlX, idX);
			if(response.length < 4){
				var r = ["Too few characters...", "My grandma has a longer name than that.", "Chinese? Please make your nickname have atleast 4 characters!"];
				abbey.respond(r[Math.floor(Math.random()*3)]);
				return;
			}else if(response.length > 16){
				var r = ["Is that a joke? Because it is too long.", "Please make it smaller.", "How do you read it? Make it smaller..", "A maximum of 16 characters is allowed."]
				abbey.respond(r[Math.floor(Math.random()*4)]);
				return;
			}else if(response.toLowerCase() == "abbey"){
				var r = ["That's me!", "Yep? Oh yeah, what's your name?", "We have the same nickname? Try <b>Abbey1</b>."];
				abbey.respond(r[Math.floor(Math.random()*3)]);
				return;
			}else if(names.indexOf(response.toLowerCase()) > -1){
				var r = ["Used by someone...", "Already in use, sorry.", "Nickname is in use, please try another one."];
				abbey.respond(r[Math.floor(Math.random()*3)]);
				return;
			}
			abbey.respond("Is <b>" + response + "</b> okay?");
			this.temporaryName = response;
			this.waitingConfirmation = true;
		}else if(this.waitingConfirmation === true){
			var res = response.toLowerCase();
			if(res === "no" || res === "nope" || res === "nop" || res === "nah"){
				abbey.respond("Okay, try again.");
				this.waitingConfirmation = false;
			}else if(res === "yes" || res === "ye" || res === "yea" || res === "yeah" || res === "yep" || res === "ya"){
				var newname = this.temporaryName;
				abbey.respond("Done! Your nickname is now <b>" + newname + "</b>.");
				socket.broadcast.to(roomname).emit("info", name + " changed his name to " + newname);
				socket.emit("info", "Your nickname has been changed from " + name + " to " + newname);
				name = newname;
				this.needsNewName = false;
				this.waitingConfirmation = false;
			}else{
				abbey.respond("Please say either yes or no.");
			}
		}
	});
	// notify others
	socket.broadcast.to(roomname).emit("info", name + " has joined the conversation.");
});

setInterval(function(){
	console.log(">> Users: " + users);
	console.log(">> Rooms: %s", rooms_);
}, 5000);