self.addEventListener('notificationclick', function (event) {
	event.notification.close();
	clients.openWindow("https://youtu.be/PAvHeRGZ_lA");
  });