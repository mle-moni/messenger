self.addEventListener('notificationclick', function (event) {
	// close on notif click
	event.notification.close();

	// This looks to see if the current is already open and
	// focuses if it is
	event.waitUntil(
		clients.matchAll({
			type: "window"
		})
		.then(function (clientList) {
			for (var i = 0; i < clientList.length; i++) {
				var client = clientList[i];
				console.log(client.url)
				if (client.url == '/' && 'focus' in client)
					return client.focus();
			}
			if (clients.openWindow) {
				return clients.openWindow('https://messenger.renouv.art/');
			}
		})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(
		fetch(event.request)
	)
});