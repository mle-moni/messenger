module.exports = {
	search_objs
};

function search_objs(query, collection, dbo, callback) {
	dbo[collection].find(
		query.rgx,
		query.projection
	).toArray(callback);
}