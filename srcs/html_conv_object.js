class ConvObject {
    constructor(socket) {
        this.psd = sessionStorage.psd;
        this.socket = socket;
        this.conversations = [];
        this.usersTable = [];
        this.current = "";
        this.newConvUsers = [];
        let self = this;

        document.getElementById("input").addEventListener("keydown", e=>{
            if (e.keyCode === 13) {
                this.sendMsg(document.getElementById("input").value);
            }
        });
        document.getElementById("add_conv_button").onclick = e=>{
            toggleCreateConvVisibility();
        };
        document.getElementById("input_get_users").addEventListener("keyup", e=>{
            this.socket.emit("getUsers", document.getElementById("input_get_users").value);
        });
        document.getElementById("create_conv_submit").addEventListener("click", e=>{
            self.createConv();
        });

        const avatar = document.getElementById("avatar");
        avatar.getElementsByTagName("h2")[0].textContent = this.psd;

        navigator.serviceWorker.ready.then(function(reg) {
            self.reg = reg;
            console.log("Service worker is ready.");
        });

        window.onpopstate = e=>{
            let mobile = innerWidth <= 700;
            if (e.state) {
                switch (e.state.action) {
                    case "load_conv":
                        self.loadConv(...e.state.params);
                        if (mobile) {
                            toggleMenuVisibility(true);
                        } else {
                            if (createConvIsVisible) {
                                toggleCreateConvVisibility(true);
                            }
                        }
                    break;
                    case "toggle_menu":
                        toggleMenuVisibility(true);
                    break;
                    case "toggle_create":
                        toggleCreateConvVisibility(true);
                    break;
                    case "root":
                        if (createConvIsVisible) {
                            toggleCreateConvVisibility(true);
                        }
                        if (!menuIsVisible) {
                            toggleMenuVisibility(true);
                        }
                    break;
                }
            } else {
                if (mobile && !menuIsVisible) {
                    toggleMenuVisibility(true);
                }
                if (menuIsVisible && createConvIsVisible) {
                    toggleCreateConvVisibility(true);
                }
            }
        }
    }
    newConv(conv) {
        const convList = document.getElementById("conv_list");
        const p = document.createElement("p");
        const list = document.getElementsByClassName("conv_name_list");
        let addConvToList = true;

        // on met a jour la table des utilisateurs
        for (let i = 0; i < conv.conv_users.length; i++) {
            this.socket.emit("getUserById", conv.conv_users[i]);
        }
        for (let i = 0; i < list.length; i++) {
            if (list[i].convID === conv._id) {
                addConvToList = false;
            }
        }
        if (addConvToList) {
            p.classList.add("clickable", "conv_name_list");
            // charge la conversation quand on clique sur le conv_name
            p.onclick = e=>{
                this.socket.emit("readMsg", e.target.convID);
                const bList = e.target.getElementsByTagName("b");
                for (let i = 0; i < bList.length; i++) {
                    e.target.removeChild(bList[i]);
                }
                this.loadConv(e.target.convID);
                this.showConv();
                const stateObj = {action: "load_conv", params: [e.target.convID]};
                window.history.pushState(stateObj, "");
            }
            p.innerText = conv.conv_name;
            p.convID = conv._id;
            convList.appendChild(p);
        }
        this.conversations[conv._id] = conv;
    }
    showConv() {
        if (window.innerWidth <= 700) {
            toggleMenuVisibility(true);
        }
        document.getElementById("msg_list").scroll(0, 10000000);
    }
    loadConv(convID) {
        const currentConv = this.conversations[convID];
        const span = document.createElement("span");
        const usersList = this.conversations[convID].conv_users.map(id=>{
            return (this.usersTable[id] || "Unknown user");
        });
        this.current = convID;
        document.getElementById("conv_name").getElementsByTagName("h1")[0].innerText = currentConv.conv_name;
        span.textContent = usersList.join(", ");
        document.getElementById("conv_name").getElementsByTagName("h1")[0].appendChild(span);
        document.getElementById("msg_list").innerHTML = ""; // on vide la liste de message avant de la remplir a nouveau
        for (let i = 0; i < currentConv.conv_data.length; i++) {
           this.newMsg(currentConv.conv_data[i]);
        }
    }
    newMsg(msgObj) {
        const msgList = document.getElementById("msg_list");
        const msg = document.createElement("article");
        const userName = this.usersTable[msgObj.user_id] || "Unknown user";

        msg.innerHTML = `<h5></h5>
        <span>
            <div style="display: flex;">
                <img src="img/unknown_user.png" />
                <div style="margin: auto;"><b class="msg-psd"></b></div>
            </div>
            <p></p>
        </span>`;
        msg.getElementsByTagName("h5")[0].textContent = this.getFormatedDate(new Date(msgObj.time));
        msg.getElementsByClassName("msg-psd")[0].textContent = userName;
        msg.getElementsByTagName("p")[0].textContent = msgObj.user_msg;
        if (userName === this.psd) {
            msg.classList.add("from-me");
        }
        msgList.appendChild(msg);
        
        msgList.scroll(0, 10000000);
    }
    getFormatedDate(date) {
        let hours = "" + date.getHours();
        let minutes = "" + date.getMinutes();

        if (hours.length != 2) hours = "0" + hours;
        if (minutes.length != 2) minutes = "0" + minutes;
        return (`${hours}h${minutes}`);
    }
    appendMsg(msgObj, convID) {
        this.conversations[convID].conv_data.push(msgObj);
        if (convID === this.current) {
            this.newMsg(msgObj);
            let mobile = innerWidth <= 700;
            this.socket.emit("readMsg", convID);
            if (mobile && menuIsVisible) {
                toggleMenuVisibility();
                document.getElementById("msg_list").scroll(0, 10000000);
            }
        } else {
            toast.message(`Nouveau message dans : ${this.conversations[convID].conv_name}`);
            const list = document.getElementById("conv_list").getElementsByTagName("p");
            for (let i = 0; i < list.length; i++) {
                if (list[i].convID === convID) {
                    // affiche '*' derriere le nom de la conversation 
                    if (list[i].getElementsByTagName("b").length === 0) {
                        list[i].innerHTML += " <b>[1]</b>";
                    } else {
                        const unread = list[i].getElementsByTagName("b")[0];
                        console.log(unread.textContent)
                        const value = parseInt(unread.textContent.replace("[", "").replace("]", ""));
                        console.log(parseInt(unread.textContent.replace("[", "").replace("]", "")))
                        unread.textContent = `[${value + 1}]`;
                    }
                }
            }
        }
        const userName = this.usersTable[msgObj.user_id] || "Unknown user";
        if (Notification.permission === "granted") {
            if (document.visibilityState !== "visible") {
                this.reg.showNotification(`${this.conversations[convID].conv_name}`, {
                    body: `${userName}: ${msgObj.user_msg}`,
                    icon: '/img/notif-icon.png',
                    vibrate: [200, 100, 200]
                });
            }
        }
    }
    updateUsersTable(userObj) {
        this.usersTable[userObj._id] = userObj.psd;
    }
    sendMsg(txt) {
        if (this.current !== "" && document.getElementById("input").value !== "") {
            this.socket.emit("newMsg", {txt}, this.current);
            document.getElementById("input").value = "";
        }
    }
    getUsers(usersArr) {
        const userList = document.getElementById("contact_list");

        userList.innerHTML = "";
        for (let i = 0; i < usersArr.length; i++) {
            let p = document.createElement("p");
    
            p.classList.add("clickable", "conv_name_list");
            p.innerText = usersArr[i].psd;
            p.userId = usersArr[i]._id;
            p.onclick = e=>{
                let hasAlready = false;
                for (let j = 0; j < this.newConvUsers.length; j++) {
                    if (this.newConvUsers[j].psd === usersArr[i].psd) {
                        hasAlready = true;
                        this.newConvUsers.splice(j, 1);
                        j--;
                    }
                }
                if (!hasAlready) {
                    this.newConvUsers.push(usersArr[i]);
                }
                document.getElementById("chosen_users").innerText = this.newConvUsers.map(o=>o.psd).join(", ");
            }
            userList.appendChild(p);
        }
    }
    createConv() {
        const convName = document.getElementById("input_get_new_conv_name").value;
        if (convName != "") {
            this.socket.emit("createConv", this.newConvUsers.map(o=>o._id), convName);
        }
    }
}