const toast = siiimpleToast;

if (Notification.permission !== "granted") {
	Notification.requestPermission((status) => {
		if (Notification.permission !== status) {
			Notification.permission = status;
		}
	});
}
navigator.serviceWorker.register('worker.js');

let menuIsVisible = true;

function toggleMenuVisibility(dontPush) {
	if (menuIsVisible) {
		document.getElementsByTagName("main")[0].style.display = "block";
		document.getElementById("chose_conv").classList.remove("menu-visible");
		document.getElementsByClassName("smartphone-menu-trigger")[0].classList.add("trigger-left");
		menuIsVisible = false;
		if (dontPush) {
			return ;
		}
		const stateObj = {params: [], action: "toggle_menu"};
		window.history.pushState(stateObj, "");
	} else {
		document.getElementsByTagName("main")[0].style.display = "none";
		document.getElementById("chose_conv").classList.add("menu-visible");
		document.getElementsByClassName("smartphone-menu-trigger")[0].classList.remove("trigger-left");
		menuIsVisible = true;
		if (dontPush) {
			return ;
		}
		const stateObj = {params: [], action: "root"};
		window.history.pushState(stateObj, "");
	}
}

let createConvIsVisible = false;

function toggleCreateConvVisibility(dontPush) {
	console.log(dontPush)
	if (createConvIsVisible) {
		document.getElementById("create_conv").classList.add("create_conv_invisible");
		createConvIsVisible = false;
		if (dontPush) {
			return ;
		}
		const stateObj = {params: [], action: "root"};
		window.history.pushState(stateObj, "");
	} else {
		document.getElementById("create_conv").classList.remove("create_conv_invisible");
		createConvIsVisible = true;
		if (dontPush) {
			return ;
		}
		const stateObj = {params: [], action: "toggle_create"};
		window.history.pushState(stateObj, "");
	}
}