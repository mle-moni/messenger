const ObjectId = require('mongodb').ObjectId;

module.exports = {
	inc,
	empty,
	getObj
};

function getObj(socket, dbo) {
	const userId = new ObjectId(socket.userId.toString());
	dbo.collection("account").findOne({_id: userId}, function(err, res) {
		if (err) throw err;
		if (res) {
			socket.emit("getUnread", res.unread);
		}
	});
}

function inc(userIdStr, convIdStr, dbo) {
	const userId = new ObjectId(userIdStr.toString());
	const field = `unread.${convIdStr}`;
	const unreadObj = {};

	unreadObj[field] = 1;

	dbo.collection("account").updateOne(
		{
			_id: userId
		},
		{
			$inc: unreadObj
		}, function(err, res) {
			// nouveau message : on augmente la valeur de messages non lus
		}
	);
}

function empty(userIdStr, convIdStr, dbo) {
	const userId = new ObjectId(userIdStr.toString());
	const field = `unread.${convIdStr}`;
	const unreadObj = {};

	unreadObj[field] = 0;
	dbo.collection("account").updateOne(
		{
			_id: userId
		},
		{
			$set: unreadObj
		}, function(err, res) {
			// l'utilisateur a ouvert la conversation, on reset la valeur de messages non lus
		}
	);
}