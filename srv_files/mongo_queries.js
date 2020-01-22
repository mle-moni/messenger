module.exports = {
	search_objs
};

function search_objs(query, collection, dbo, callback) {
	dbo.collection(collection).find(
		query.rgx,
		{psd: 1}
	).toArray(callback);
}