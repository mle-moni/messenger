// const mongo = require("./mongo_queries");

module.exports = {
	create,
	searchUsers
};

function create(users) {

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
		socket.emit("getUsers", res);
	});
}
// dbo.collection("account").insertOne(accObj, function(err, res) {
// 	if (err) throw err;
// });