const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

const handler = require("./srv_files/handler").handle;
const connection = require("./srv_files/connection");

const Analyse = {
    connnected: 0,
    total: 0
};

const server = http.createServer(handler).listen(8088, "localhost");

const io = require('socket.io')(server);

MongoClient.connect(url, {
    useNewUrlParser: true,
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
		});
	
		socket.on("testPsd", (psd, num)=>{
			connection.testPsd(psd, num, socket, dbo);
		});
	
		socket.on("connections", (str)=>{
			socket.emit("log1", Analyse);
		});
	
		socket.on("genGame", ()=>{
			if (socket.hasOwnProperty("psd")) {
				socket.emit("getId", socket.id, socket.psd);
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

		socket.on("wait_opponent", () => {
			if (socket.hasOwnProperty("psd"))
				queueSystem.add(socket, io);
		});

		socket.on("turn", (mode, pos, pos2) => {
			if (socket.hasOwnProperty("psd"))
				gameCore.turn(socket, io, mode, pos, pos2);
		});
	
		socket.on("disconnect", ()=>{
			queueSystem.rm(socket);
			Analyse.connnected--;
		});
	});
});

console.log("online at : http://localhost:8000");