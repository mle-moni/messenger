const ObjectId = require('mongodb').ObjectId;

module.exports = {
	create,
	searchUsers,
	setUserId
};

function deleteDoubles(obj) {
	const previousUsers = [];
	for (let i = 0; i < obj.users.length; i++) {
		let bad = false;
		for (let j = 0; j < previousUsers.length; j++) {
			if (obj.users[i] === previousUsers[j]) {
				bad = true;
				break;
			}
		}
		if (bad) {
			obj.users.splice(i, 1);
			i--;
		} else {
			previousUsers.push(obj.users[i]);
		}
	}
}

function create(obj, socket, dbo) {
	obj.users.unshift(socket.userId);
	if (obj.users.length < 2) {
		socket.emit("log", `La conversation doit avoir plusieurs utilisateurs.`);
		return ;
	}
	deleteDoubles(obj);
	const convObj = {
		conv_name: obj.convName,
		conv_data: [],
		conv_users: obj.users
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