const ObjectId = require('mongodb').ObjectId;
const crypt = require("../../global/crypt");

module.exports = {
	create,
	searchUsers,
	quit,
	get,
	addUsers,
	rmUser,
	rename,
	isMongoID,
	verifUsers
};

function isMongoID(str) {
	if (typeof(str) === "string" && str.length === 24)
		return (true);
	return (false);
}

function checkPrevious(users, pos) {
	for (let i = 0; i < pos; i++) {
		if (users[i] === users[pos])
			return 1;
	}
	return 0;
}

function deleteErrors(users) {
	for (let i = 0; i < users.length; i++) {
		if (checkPrevious(users, i)) {
			users.splice(i, 1);
			i--;
		} else if (!isMongoID(users[i])) {
			users.splice(i, 1);
			i--;
		}
	}
}

function rmUser(userIdStr, convIdStr, socket, dbo, io) {
	const convId = new ObjectId(convIdStr);

	dbo.collection("conversations").findOne({
		_id: convId
	}, function(err, result) {
		if (err) throw err;
		if (!result) {
			socket.emit("log", "Conversation introuvable.");
			return ;
		}
		if (result.conv_users[0].toString() !== socket.userId.toString()) {
			socket.emit("log", "Permission denied.");
			return ;
		}
		quit(userIdStr, convIdStr, socket, dbo, io);
	});
}

function removeIfAlreadyThere(convUsers, newUsers) {
	for (let i = 0; i < newUsers.length; i++) {
		for (let j = 0; j < convUsers.length; j++) {
			if (newUsers[i] === convUsers[j]) {
				newUsers.splice(i, 1);
				i--;
				break ;
			}
		}
	}
}

function makeUserActionRoom(userId, action, room, sockets) {
	for (let socketId in sockets) {
		if (sockets[socketId].userId.toString() === userId.toString()) {
			sockets[socketId][action](room);
			break ;
		}
	}
}

function addUsers(users, convIdStr, socket, dbo, io) {
	const convId = new ObjectId(convIdStr);

	dbo.collection("conversations").findOne({
		_id: convId
	}, function(err, result) {
		if (err) throw err;
		if (!result) {
			socket.emit("log", "Conversation introuvable.");
			return ;
		}
		if (result.conv_users.length !== 0 && result.conv_users[0].toString() !== socket.userId.toString()) {
			socket.emit("log", "Permission denied.");
			return ;
		}
		deleteErrors(users);
		const convUsers = result.conv_users.map(objId=>objId.toString());
		removeIfAlreadyThere(convUsers, users);
		for (let i = 0; i < users.length; i++) {
			dbo.collection("account").updateOne({_id: new ObjectId(users[i])}, {
				$push: {
					convs_id: convId
				}
			}, function(err, res) {
				// on a push la conv_id dans art.account[user].convs_id
				if (res.matchedCount == 1) {
					dbo.collection("conversations").updateOne({_id: convId}, {
						$push: {
							conv_users: new ObjectId(users[i])
						}
					}, function(err, res) {
						// on a push l'ID de cet user dans le field conv_users de la conv
						socket.emit("log", `L'utilisateur avec l'ID : ${users[i]} a été ajouté.`);
						makeUserActionRoom(users[i], "join", convId.toString(), io.sockets.connected);
						// todo : envoyer une notification a chaque utilisateur
					});
				}
			});
		}
	});
}

function create(obj, socket, dbo, io) {
	obj.users.unshift(socket.userId.toString());
	deleteErrors(obj.users);
	if (obj.convName.length > 50 || obj.convName === 0) {
		socket.emit("log", `Le nom de la conversation est trop long ou null.`);
		return ;
	}
	const convObj = {
		conv_name: crypt.aesEncode(obj.convName),
		conv_data: [],
		conv_users: []
	};
	dbo.collection("conversations").insertOne(convObj, function(err, res) {
		if (err) throw err;
		const newConvId = res.insertedId;
		socket.emit("log", `La conversation : ${obj.convName} a bien été créée, son ID est ${newConvId}.`);
		addUsers(obj.users, newConvId, socket, dbo, io);
	});
}

function searchUsers(name, socket, dbo) {
	if (name == "") {
		socket.emit("getUsers", []);
			return ;
	}
	const query = {
		rgx: new RegExp(name, "i"),
		projection: {_id: 1, psd: 1}
	};

	dbo.collection("account").find()
	.project(query.projection)
	.toArray((err, res) => {
		if (err) throw err;
		res = res.map(o => {
			o._id = crypt.encode(o._id);
			o.psd = crypt.decode(o.psd);
			return o;
		});
		res = res.filter(obj => (obj.psd != socket.psd && query.rgx.test(obj.psd)));
		socket.emit("getUsers", res);
	});
}

function deleteConv(convId, dbo) {
	dbo.collection("conversations").deleteOne({
		_id: new ObjectId(convId)
	}, function(err, result) {
		if (err) throw err;
		console.log(`Conversation with ID : ${convId} deleted.`)
	});
}

function testConv(convId, dbo) {
	dbo.collection("conversations").findOne({
		_id: new ObjectId(convId)
	}, function(err, result) {
		if (err) throw err;
		if (result !== null) {
			if (result.conv_users.length === 0) {
				deleteConv(convId, dbo);
			}
		}
	});
}

function quit(userIdStr, convIdStr, socket, dbo, io) {
	const userId = new ObjectId(userIdStr), convId = new ObjectId(convIdStr);

	dbo.collection("conversations").updateOne({_id: convId}, {
		$pull: {
			conv_users: userId
		}
	}, function(err, res) {
		// on a retiré l'utilisateur de la conversation
		dbo.collection("account").updateOne({_id:  userId}, {
			$pull: {
				convs_id: convId
			}
		}, function(err, res) {
			// on a retiré la conversation du compte de l'utilisateur
			makeUserActionRoom(userIdStr, "leave", convIdStr, io.sockets.connected);
			socket.emit("log", `Vous avez retiré l'utilisateur ${userIdStr} de la conversation ${convIdStr}`);
			testConv(convId, dbo);
		});
	});
}

function get(socket, dbo) {
	dbo.collection("account").findOne({
		_id: socket.userId
	}, function(err, result) {
		if (err) throw err;
		if (result !== null) {
			socket.emit("getConvs", result.convs_id);
		}
	});
}

function rename(newName, convIdStr, socket, dbo) {
	const convId = new ObjectId(convIdStr);
	const succesMsg = `Vous avez renommé la conversation ${convIdStr} en ${newName}.`;

	dbo.collection("conversations").findOne({
		_id: convId
	}, function(err, result) {
		if (err) throw err;
		if (!result) {
			socket.emit("log", "Conversation introuvable.");
			return ;
		}
		if (result.conv_users[0].toString() !== socket.userId.toString()) {
			socket.emit("log", "Permission denied.");
			return ;
		}
		dbo.collection("conversations").updateOne({_id:  userId}, {
			$set: {
				conv_name: newName
			}
		}, function(err, res) {
			// on a renomé la conversation
			socket.emit("log", succesMsg);
		});
	});
}

function verifUsers(users) {
	// decode crypted usersID and verify content
	let formatOk = true;

	users.map(str=>{
		let decryptedID;
		try {
			decryptedID = crypt.decode(str);
		} catch (e) {
			return ({users: [], ok: false});
		}
		if (!isMongoID(decryptedID))
			formatOk = false;
		return (decryptedID);
	});
	return ({users, ok: formatOk});
}