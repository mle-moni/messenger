(function () {
	function automaticReconnection(connectObj, innerSocket) {
		if (connectObj.psd !== null && connectObj.passwd !== null) {
			innerSocket.emit("connectemoistp", connectObj, "lazy");
		} else {
			sessionStorage.setItem("goTo", location.pathname);
			location.replace("/login");
		}
	}
	let appReady = false;
	const innerSocket = io.connect(location.origin, {secure: true, rejectUnauthorized: true});

	if (localStorage.getItem('psd')) {
		sessionStorage.setItem('psd', localStorage.getItem('psd'))
	}
	if (localStorage.getItem('passwd')) {
		sessionStorage.setItem('passwd', localStorage.getItem('passwd'))
	}
	const connectObj = {
		psd: sessionStorage.getItem('psd'),
		passwd: sessionStorage.getItem('passwd')
	};
	automaticReconnection(connectObj, innerSocket);
    
	// sockets events
	
	// DEBUG MODE ONLY, A RETIRER !!!
	window.socket = innerSocket;
	
	innerSocket.on("logAndComeBack", ()=>{
		sessionStorage.setItem("goTo", location.pathname);
		location.replace("/login");
	});

	innerSocket.on("deco", ()=>{
		sessionStorage.clear()
		localStorage.clear();
		sessionStorage.setItem("goTo", location.pathname);
	    location.replace("/login");
	});

	innerSocket.on("getUsers", res=>{
		console.log(res);
	});

	innerSocket.on("getConvs", res=>{
		console.log(res);
	});

	innerSocket.on("MAJ", (txt)=>{
		alert(txt);
		location.reload();
	});

	window.onfocus = () => {
		automaticReconnection(connectObj, innerSocket);
	}
	document.onvisibilitychange = function(e) { 
		if (document.visibilityState === "visible")
			automaticReconnection(connectObj, innerSocket);
	};

	innerSocket.on("succes_co", ()=>{
		appReady = true;
		console.log("Ready, app is now usable");
	});

	innerSocket.on("disconnect", ()=>{
		appReady = false;
		console.log("Disconnected, app is not longer usable");
	});
	
	innerSocket.on("log", (txt)=>console.log(txt));
})();