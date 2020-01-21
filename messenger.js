const http = require('http');
const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
// const url = "mongodb://localhost:27017/";
const url = "mongodb://art_admin:fautQUILsoitLONG???OUItresLONG@localhost:27017/art";

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
	useUnifiedTopology: true
}, function(err, db) {
    if (err) throw err;

    function entierAleatoire(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
	io.on('connection', function (socket) {
		Analyse.connnected++;
		Analyse.total++;
	
		socket.on("createAcc", (obj)=>{
			connection.createAccount(obj, socket, db);            
		});
	
		socket.on("connectemoistp", (obj, coSettings)=>{
			connection.connect(obj, coSettings, socket, db);
		});
	
		socket.on("testPsd", (psd, num)=>{
			connection.testPsd(psd, num, socket, db);
		});
	
		socket.on("connections", (str)=>{
			socket.emit("log1", Analyse);
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