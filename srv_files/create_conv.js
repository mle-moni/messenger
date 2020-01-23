const ObjectId = require('mongodb').ObjectId;

module.exports = {
	create,
	searchUsers,
	setUserId,
	quit,
	get
};

function checkPrevious(obj, pos) {
	for (let i = 0; i < pos; i++) {
		if (obj.users[i] === obj.users[pos])
			return 1;
	}
	return 0;
}

function deleteDoubles(obj) {
	for (let i = 0; i < obj.users.length; i++) {
		if (checkPrevious(obj, i)) {
			obj.users.splice(i, 1);
			i--;
		}
	}
}

function create(obj, socket, dbo) {
	obj.users.unshift(socket.userId.str);
	if (obj.users.length < 2) {
		socket.emit("log", `La conversation doit avoir plusieurs utilisateurs.`);
		return ;
	}
	deleteDoubles(obj);
	const convObj = {
		conv_name: obj.convName,
		conv_data: [],
		conv_users: obj.users.map(str=>new ObjectId(str))
	};
	dbo.collection("conversations").insertOne(convObj, function(err, res) {
		if (err) throw err;
		const newConvId = res.insertedId;
		socket.emit("log", `La conversation : ${obj.convName} a bien été créée, son ID est ${newConvId}.`);
		for (let i = 0; i < obj.users.length; i++) {
			dbo.collection("account").updateOne({_id: new ObjectId(obj.users[i])}, {
				$push: {
					convs_id: newConvId
				}
			}, function(err, res) {
				// on a push la nouvelle conv_ID dans chaque art.account[user].convs_id
				// todo : envoyer une notification a chaque utilisateur
			});
		}
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

function quit(convId, socket, dbo) {
	dbo.collection("conversations").updateOne({_id: new ObjectId(convId)}, {
		$pull: {
			conv_users: socket.userId
		}
	}, function(err, res) {
		// on a retiré l'utilisateur de la conversation
		dbo.collection("account").updateOne({_id:  socket.userId}, {
			$pull: {
				conv_users: new ObjectId(convId)
			}
		}, function(err, res) {
			// on a retiré la conversation du compte de l'utilisateur
			socket.emit("log", `Vous avez quitté la conversation qui a pour ID : ${convId}.`);
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