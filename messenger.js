const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = require("../global/db_url").art;

const handler = require("./srv_files/handler").handle;
const connection = require("../global/connection");
const conv = require("./srv_files/conv_client");
const msg_client = require("./srv_files/msg_client");
const crypt = require("../global/crypt");

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
		socket.emit("tryAutomaticReco");
	
		socket.on("createAcc", (obj)=>{
			connection.createAccount(obj, socket, dbo);            
		});
	
		socket.on("connectemoistp", (obj, coSettings)=>{
			connection.connect(obj, coSettings, socket, dbo);
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
				if (typeof(userName) === "string") {
					conv.searchUsers(userName, socket, dbo);
				} else {
					socket.emit("error!", "Le pseudo doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("getUserById", (userId) => {
			if (socket.hasOwnProperty("psd")) {
				if (typeof(userId) === "string") {
					conv.getUser(userId, socket, dbo);
				} else {
					socket.emit("error!", "L'ID doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("createConv", (users, convName)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (users.push !== undefined && typeof(convName) === "string") {
					let obj = conv.verifUsers(users);

					users = obj.users;
					if (obj.ok)
						conv.create({users, convName}, socket, dbo, io);
					else
						socket.emit("error!", "Les identifiants des utilisateurs doivent etre dans un array. Le nom de la conversation doit etre une chaine de charactere.");
				} else {
					socket.emit("error!", "Les identifiants des utilisateurs doivent etre dans un array. Le nom de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("quitConv", (convId)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (conv.isMongoID(convId)) {
					conv.quit(socket.userId.toString(), convId, socket, dbo, io);
				} else {
					socket.emit("error!", "Le parametre doit etre l'id de la conversation.");
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

		// convs moderation (these functions needs conv admin privileges)

		socket.on("addToConv", (users, convId)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (users.push !== undefined && conv.isMongoID(convId)) {
					let obj = conv.verifUsers(users);

					users = obj.users;
					if (obj.ok)
						conv.addUsers(users, convId, socket, dbo, io);
				} else {
					socket.emit("error!", "Les identifiants des utilisateurs doivent etre dans un array. L'ID de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("rmFromConv", (userId, convId)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				try {
					userId = crypt.decode(userId);
				} catch (e) {
					socket.emit("error!", "Erreur lors du parsing..");
					return ;
				}
				if (conv.isMongoID(userId) && conv.isMongoID(convId)) {
					conv.rmUser(userId, convId, socket, dbo, io);
				} else {
					socket.emit("error!", "L'identifiant de l'utilisateur doit etre une chaine de charactere. L'ID de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("renameConv", (newName, convId)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (typeof(newName) === "string" && conv.isMongoID(convId)) {
					conv.rename(newName, convId, socket, dbo);
				} else {
					socket.emit("error!", "Le nouveau nom de la conversation doit etre une chaine de charactere. L'ID de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("newMsg", (msg, convId) => {
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (conv.isMongoID(convId)) {
					if (typeof(msg) === "object") {
						msg_client.newMsg(msg, convId, socket, dbo, io);
					} else {
						socket.emit("error!", "Erreur lors du parsing du message.");
					}
				} else {
					socket.emit("error!", "L'ID de la conversation doit etre une chaine de charactere.");
				}
			} else {
				socket.emit("logAndComeBack");
			}
		});

		socket.on("readMsg", (convIdStr)=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				if (typeof (convIdStr) === "string") {
					msg_client.readMsg(convIdStr, socket, dbo);
				}
			}
		});

		socket.on("getUnread", ()=>{
			if (socket.hasOwnProperty("psd") && socket.hasOwnProperty("userId")) {
				msg_client.getUnread(socket, dbo);
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