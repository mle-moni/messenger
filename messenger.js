const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://art_admin:bonjour_BONJOUR_NANMAISREPONDFDP@localhost:27017/?authSource=art";

const handler = require("./srv_files/handler").handle;
const connection = require("./srv_files/connection");
const conv = require("./srv_files/conv_client");

const Analyse = {
    connnected: 0,
    total: 0
};

const server = http.createServer(handler).listen(8088, "localhost");

const io = require('socket.io')(server);

MongoClient.connect(url, {
	useNewUrlParser: true,
	useUnifiedTopology: true
}, function(err, db) {
	if (err) throw err;
    let dbo = db.db("art");

    function entierAleatoire(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
	io.on('connection', function (socket) {
		Analyse.connnected++;
		Analyse.total++;
	
		socket.on("createAcc", (obj)=>{
			connection.createAccount(obj, socket, dbo);            
		});
	
		socket.on("connectemoistp", (obj, coSettings)=>{
			connection.connect(obj, coSettings, socket, dbo);
			conv.setUserId(obj.psd, socket, dbo);
		});

		socket.on("decomoi", ()=>{
            delete(socket.psd);
			delete(socket.passwd);
			delete(socket.userId);
			socket.emit("deco");
        });
	
		socket.on("testPsd", (psd, num)=>{
			connection.testPsd(psd, num, socket, dbo);
		});
	
		socket.on("connections", (str)=>{
			socket.emit("log1", Analyse);
		});

		// conversation generation / deletion

		socket.on("getUsers", (userName) => {
			if (socket.hasOwnProperty("psd")) {
				conv.searchUsers(userName, socket, dbo);
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("createConv", (users, convName)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (users.push !== undefined && typeof(convName) === "string") {
					conv.create({users, convName}, socket, dbo);
				} else {
					socket.emit("log", "Les identifiants des utilisateurs doivent etre dans un array. Le nom de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("quitConv", (convId)=>{
			const succesMsg = `Vous avez quitté la conversation qui a pour ID : ${convId}.`;

			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (typeof(convId) === "string" && convId.length === 24) {
					conv.quit(socket.userId.toString(), convId, socket, dbo, succesMsg);
				} else {
					socket.emit("log", "Le parametre doit etre l'id de la conversation.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("getConvs", ()=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				conv.get(socket, dbo);
			} else {
				socket.emit("logAndComeBack");
			}
		});

		// convs moderation

		socket.on("addToConv", (users, convId)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (users.push !== undefined && typeof(convId) === "string" && convId.length === 24) {
					conv.addUsers(users, convId, socket, dbo);
				} else {
					socket.emit("log", "Les identifiants des utilisateurs doivent etre dans un array. Le nom de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("rmFromConv", (userId, convId)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (typeof(userId) === "string" && userId.length === 24 && typeof(convId) === "string" && convId.length === 24) {
					conv.rmUser(userId, convId, socket, dbo);
				} else {
					socket.emit("log", "L'identifiant de l'utilisateur doit etre une chaine de charactere. Le nom de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("MAJ", txt=> {
			if (socket.psd == "Redz") {
				socket.broadcast.emit("MAJ", txt);
			} else {
				socket.emit("MAJ", "Bien pris qui croyais prendre x)");
			}
			socket.emit("MAJ", txt);
		});
	
		socket.on("disconnect", ()=>{
			
			Analyse.connnected--;
		});
	});
});