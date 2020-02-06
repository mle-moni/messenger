if (Notification.permission !== "granted") {
	Notification.requestPermission((status) => {
		if (Notification.permission !== status) {
			Notification.permission = status;
		}
	});
}
navigator.serviceWorker.register('worker.js');

let menuIsVisible = true;

function toggleMenuVisibility() {
	if (menuIsVisible) {
		document.getElementsByTagName("main")[0].style.display = "block";
		document.getElementById("chose_conv").classList.remove("menu-visible");
		document.getElementsByClassName("smartphone-menu-trigger")[0].classList.add("trigger-left");
		menuIsVisible = false;
	} else {
		document.getElementsByTagName("main")[0].style.display = "none";
		document.getElementById("chose_conv").classList.add("menu-visible");
		document.getElementsByClassName("smartphone-menu-trigger")[0].classList.remove("trigger-left");
		menuIsVisible = true;
	}
}