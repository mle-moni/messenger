const ObjectId = require('mongodb').ObjectId;

module.exports = {
	create,
	searchUsers,
	setUserId,
	quit,
	get,
	addUsers
};

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
		} else if (!(typeof(users[i]) === "string" && users[i].length === 24)) {
			users.splice(i, 1);
			i--;
		}
	}
}

function addUsers(users, convId, socket, dbo) {
	deleteErrors(users);
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
					// todo : envoyer une notification a chaque utilisateur
				});
			}
		});
	}
}

function create(obj, socket, dbo) {
	obj.users.unshift(socket.userId.toString());
	deleteErrors(obj.users);
	if (obj.users.length === 0) {
		socket.emit("log", `La conversation : ${obj.convName} n'a pas été créée.`);
		return ;
	}
	const convObj = {
		conv_name: obj.convName,
		conv_data: [],
		conv_users: []
	};
	dbo.collection("conversations").insertOne(convObj, function(err, res) {
		if (err) throw err;
		const newConvId = res.insertedId;
		socket.emit("log", `La conversation : ${obj.convName} a bien été créée, son ID est ${newConvId}.`);
		addUsers(obj.users, newConvId, socket, dbo);
	});
}

function searchUsers(name, socket, dbo) {
	if (name == "") {
		socket.emit("getUsers", []);
			return ;
	}
	const query = {
		rgx: {psd: new RegExp(name, "i")},
		projection: {_id: 1, psd: 1}
	};

	dbo.collection("account").find(query.rgx)
	.project(query.projection)
	.toArray((err, res) => {
		if (err) throw err;
		for (let i = 0; i < res.length; i++) {
			if (res[i].psd === socket.psd) {
				res.splice(i, 1);
			}
		}
		socket.emit("getUsers", res);
	});
}

function setUserId(userName, socket, dbo) {
	dbo.collection("account").findOne({
		psd: userName
	}, function(err, result) {
		if (err) throw err;
		if (result !== null) {
			socket.userId = result._id;
		}
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

function quit(convId, socket, dbo) {
	dbo.collection("conversations").updateOne({_id: new ObjectId(convId)}, {
		$pull: {
			conv_users: socket.userId
		}
	}, function(err, res) {
		// on a retiré l'utilisateur de la conversation
		dbo.collection("account").updateOne({_id:  socket.userId}, {
			$pull: {
				convs_id: new ObjectId(convId)
			}
		}, function(err, res) {
			// on a retiré la conversation du compte de l'utilisateur
			socket.emit("log", `Vous avez quitté la conversation qui a pour ID : ${convId}.`);
			testConv(convId, dbo);
		});
	});
}

function get(socket, dbo) {
	dbo.collection("account").findOne({
		psd: socket.psd
	}, function(err, result) {
		if (err) throw err;
		if (result !== null) {
			socket.emit("getConvs", result.convs_id);
		}
	});
}