if (Notification.permission === "default") {
	alert("Salut, si tu veux avoir les notifications des messages tant que l'onglet est ouvert, tu peux en acceptant la prochaine popup :)");
	Notification.requestPermission();
	
}

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