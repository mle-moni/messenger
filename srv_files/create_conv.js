const mongo = require("./mongo_queries");

module.exports = {
	create,
	searchUsers
};

function create() {

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
	mongo.search_objs(query, "account", dbo, (err, res) => {
		if (err) throw err;
		socket.emit("getUsers", res);
	});
}