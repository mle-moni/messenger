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
	const conversations = new ConvObject(innerSocket);
	
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
	
	// try to keep alive the socket
	setInterval(()=>{
		automaticReconnection(connectObj, innerSocket);
	}, 2000);
    
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

	innerSocket.on("error!", (err)=>{
		toast.alert(err, {duration: 7000});
		console.error(err)
	});
	
	innerSocket.on("getUsers", res=>{
		console.log(res);
		conversations.getUsers(res);
	});
	
	innerSocket.on("setUser", res=>{
		conversations.updateUsersTable(res);
	});
	
	innerSocket.on("getConvs", res=>{
		console.log(res);
	});
	
	innerSocket.on("conversation", convObj=>{
		console.log(convObj);
		conversations.newConv(convObj);
		
	});
	
	innerSocket.on("getUnread", (obj)=>{
		console.log(obj)
		const list = document.getElementById("conv_list").getElementsByTagName("p");

		for (let convID in obj) {
			for (let i = 0; i < list.length; i++) {
				if (list[i].convID === convID) {
					// affiche le nombre de messages non lus
					if (obj[convID] !== 0) {
						if (list[i].getElementsByTagName("b").length === 0) {
							list[i].innerHTML += ` <b>[${obj[convID]}]</b>`;
						} else {
							list[i].getElementsByTagName("b")[0].innerHTML = `[${obj[convID]}]`;
						}
					}
				}
			}
		}
	});
	
	innerSocket.on("success!", (msg, action)=>{
		console.log(msg);
		toast.success(msg);
		if (typeof(action) === "string") {
			eval(action);
		}
	});

	innerSocket.on("addSuccess", (usrId)=>{
		toast.success(`L'utilisateur ${conversations.usersTable[usrId]} a été ajouté.`,  { delay: 500 });
	});

	innerSocket.on("newMsg", (msgObj, convId) => {
		console.log(`Nouveau message de la conversation ${convId} :`);
		let time = new Date(msgObj.time)
		console.log(`${time.getHours()}h${time.getMinutes()} - ${msgObj.user_id} : ${msgObj.user_msg}`);
		conversations.appendMsg(msgObj, convId);
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

	innerSocket.on("tryAutomaticReco", ()=>{
		if (document.visibilityState === "visible")
			automaticReconnection(connectObj, innerSocket);
	});

	innerSocket.on("succes_co", ()=>{
		appReady = true;
		toast.success("Connected");
		console.log("Ready, app is now usable");
		setTimeout(()=>{
            this.socket.emit("getUnread");
        }, 200);
	});

	innerSocket.on("disconnect", ()=>{
		appReady = false;
		document.getElementById("conv_list").innerHTML = "";
		toast.alert("Connection lost");
		console.error("Disconnected, app is no longer usable");
		setTimeout(()=>{
			automaticReconnection(connectObj, innerSocket);
		}, 500);
	});
	
	innerSocket.on("log", (txt)=>{
		console.log(txt)
	});
})();