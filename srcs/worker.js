self.addEventListener('notificationclick', function(event) {
    let url = 'https://messenger.renouv.art/test.html';
    event.notification.close(); // Android needs explicit close.
    event.waitUntil(
        self.clients.matchAll({type: 'window'}).then( windowClients => {
            // Check if there is already a window/tab open with the target URL
            for (var i = 0; i < windowClients.length; i++) {
                var client = windowClients[i];
                // If so, just focus it.
                if ('focus' in client) {
                    return client.focus();
                }
            }
            // If not, then open the target URL in a new window/tab.
            if (self.clients.openWindow) {
                return self.clients.openWindow(url);
            }
        })
    );
});