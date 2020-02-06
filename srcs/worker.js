const self = this;

self.addEventListener('notificationclick', function (event) {
	event.notification.close();
	clients.openWindow("https://youtu.be/PAvHeRGZ_lA");
  });

self.addEventListener('fetch', function(event) {
event.respondWith(
	caches.match(event.request).catch(function() {
		return fetch(event.request);
	})
);
});