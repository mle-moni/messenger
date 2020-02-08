const ObjectId = require('mongodb').ObjectId;
const crypt = require("../../global/crypt");

module.exports = {
	create,
	searchUsers,
	getUser,
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
			socket.emit("error!", "Conversation introuvable.");
			return ;
		}
		if (result.conv_users[0].toString() !== socket.userId.toString()) {
			socket.emit("error!", "Permission denied.");
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
		if (sockets[socketId].hasOwnProperty("userId") &&
		sockets[socketId].userId.toString() === userId.toString()) {
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
			socket.emit("error!", "Conversation introuvable.");
			return ;
		}
		if (result.conv_users.length !== 0 && result.conv_users[0].toString() !== socket.userId.toString()) {
			socket.emit("error!", "Permission denied.");
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
						socket.emit("addSuccess", `${crypt.encode(users[i])}`);
						makeUserActionRoom(users[i], "join", convId.toString(), io.sockets.connected);
						// todo : envoyer une notification a chaque utilisateur
					});
				}
			});
		}
		
		// emit conv to new users
		setTimeout(()=>{
			dbo.collection("conversations").findOne({
				_id: convId
			}, function(err, result) {
				if (result !== null) {
					result.conv_name = crypt.aesDecode(result.conv_name);
					result.conv_data = result.conv_data.map(o=>{
						o.user_id = crypt.encode(crypt.aesDecode(o.user_id));
						o.user_msg = crypt.aesDecode(o.user_msg);
						return (o);
					});
					result.conv_users = result.conv_users.map(id=>{
						return (crypt.encode(id.toString()));
					});
					for (let i = 0; i < users.length; i++) {
						io.to(users[i]).emit("conversation", result);
					}
				}
			});
		}, 1000);
	});
}

function create(obj, socket, dbo, io) {
	obj.users.unshift(socket.userId.toString());
	deleteErrors(obj.users);
	if (obj.convName.length > 50 || obj.convName === 0) {
		socket.emit("error!", `Le nom de la conversation est trop long ou null.`);
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
		socket.emit("success!", `La conversation : ${obj.convName} a bien été créée.`, "toggleCreateConvVisibility()");
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
			o._id = crypt.encode(o._id.toString());
			o.psd = crypt.decode(o.psd);
			return o;
		});
		if (/^-o equal/.test(name)) {
			name = name.slice(8);
			res = res.filter(obj => (name === obj.psd));
		} else {

			res = res.filter(obj => (query.rgx.test(obj.psd)));
		}
		socket.emit("getUsers", res);
	});
}

function getUser(cryptedUserId, socket, dbo) {
	if (cryptedUserId == "") {
		socket.emit("error!", "Bad userID");
			return ;
	}
	let decryptedID;

	try {
		decryptedID = crypt.decode(cryptedUserId);
	} catch (e) {
		socket.emit("error!", "Bad userID");
		return ;
	}
	if (!isMongoID(decryptedID)) {
		socket.emit("error!", "Bad userID");
		return ;
	}
	const query = {	_id: new ObjectId(decryptedID)};
	const options = {
		"projection": {_id: 1, psd: 1}
	};
	dbo.collection("account").findOne( query, options)
	.then(res=>{
		if (res) {
			res._id = crypt.encode(res._id.toString());
			res.psd = crypt.decode(res.psd);
			socket.emit("setUser", res);
		} else {
			socket.emit("error!", "Can't find user..");
		}
	})
	.catch( (err) => console.error(`Error while searching user by ID : ${err}`));
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
			socket.emit("success!", `Vous avez retiré l'utilisateur ${userIdStr} de la conversation ${convIdStr}`);
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
			socket.emit("error!", "Conversation introuvable.");
			return ;
		}
		if (result.conv_users[0].toString() !== socket.userId.toString()) {
			socket.emit("error!", "Permission denied.");
			return ;
		}
		dbo.collection("conversations").updateOne({_id: convId}, {
			$set: {
				conv_name: newName
			}
		}, function(err, res) {
			// on a renomé la conversation
			socket.emit("succes!", succesMsg);
		});
	});
}

function verifUsers(users) {
	// decode crypted usersID and verify content
	let formatOk = true;

	users = users.map(str=>{
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