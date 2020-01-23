(function () {
    let scope = false;
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
	if (connectObj.psd !== null && connectObj.passwd !== null) {
		innerSocket.emit("connectemoistp", connectObj, "hard");
	} else {
        sessionStorage.setItem("goTo", location.pathname);
	    location.replace("/login");
    }

	innerSocket.emit("genScope");
	function genScope(password, pseudo, socket) {
	
		const scope = {
			password,
			pseudo,
			socket
		};        
		return scope;
    }
    
    // sockets events

	innerSocket.on("getId", (id, psd) => {
		scope = genScope(id, psd, innerSocket);
		
		// DEBUG MODE ONLY, A RETIRER !!!
		window.scope = scope;
	});
	
	innerSocket.on("logAndComeBack", ()=>{
		sessionStorage.setItem("goTo", location.pathname);
		location.replace("/login");
	});

	innerSocket.on("getUsers", res=>{
		console.log(res);
	});

	innerSocket.on("MAJ", (txt)=>{
		alert(txt);
		location.reload();
	});
	
	innerSocket.on("log", (txt)=>console.log(txt));
})();