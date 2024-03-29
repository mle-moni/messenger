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
				if (client.url == 'https://messenger.mle-moni.fr/' && 'focus' in client)
					return client.focus();
			}
			if (clients.openWindow) {
				return clients.openWindow('https://messenger.mle-moni.fr/');
			}
		})
	);
});

self.addEventListener('fetch', function (event) {
	event.respondWith(
		fetch(event.request)
	)
});