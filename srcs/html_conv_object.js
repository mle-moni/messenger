class ConvObject {
    constructor(socket) {
        this.socket = socket;
        this.conversations = [];
        this.usersTable = [];
        this.current = "";
        document.getElementById("input").addEventListener("keydown", e=>{
            if (e.keyCode === 13) {
                this.sendMsg(document.getElementById("input").value);
            }
        });
        document.getElementById("add_conv_button").onclick = e=>{
            console.log("coucou")
            document.body.classList.replace("body_show_list", "body_show_create");
            document.getElementById("create_conv").style.display = "block";
            document.getElementById("chose_conv").style.display = "none";
        };
    }
    newConv(conv) {
        const convList = document.getElementById("conv_list");
        const p = document.createElement("p");

        // on met a jour la table des utilisateurs
        for (let i = 0; i < conv.conv_users.length; i++) {
            this.socket.emit("getUserById", conv.conv_users[i]);
        }
        this.conversations[conv._id] = conv;
        p.classList.add("clickable", "conv_name_list");
        // charge la conversation quand on clique sur le conv_name
        p.onclick = e=>{
            // console.log(e.target)
            this.loadConv(e.target.convID);
            this.showConv();
        }
        p.innerText = conv.conv_name;
        p.convID = conv._id;
        convList.appendChild(p);
    }
    showConv() {
        const choseConv = document.getElementById("chose_conv");

        document.body.classList.replace("body_show_list", "body_show_conv");
        choseConv.style.display = "none";
        document.getElementById("conversation").style.display = "grid";
    }
    loadConv(convID) {
        const currentConv = this.conversations[convID];
        
        this.current = convID;
        document.getElementById("conv_name").innerText = currentConv.conv_name;
        document.getElementById("msg_list").innerHTML = ""; // on vide la liste de message avant de la remplir a nouveau
        for (let i = 0; i < currentConv.conv_data.length; i++) {
           this.newMsg(currentConv.conv_data[i]);
        }
    }
    newMsg(msgObj) {
        const msgList = document.getElementById("msg_list");
        const p = document.createElement("p");
        const time = new Date(msgObj.time);
        const userName = this.usersTable[msgObj.user_id] || "Unknown user";
        p.innerText = `${time.getHours()}h${time.getMinutes()} - ${userName} : ${msgObj.user_msg}`;
        // p.classList.add()
        msgList.appendChild(p);
    }
    appendMsg(msgObj, convID) {
        this.conversations[convID].conv_data.push(msgObj);
        if (convID === this.current) {
            this.newMsg(msgObj);
        }
    }
    updateUsersTable(userObj) {
        this.usersTable[userObj._id] = userObj.psd;
    }
    sendMsg(txt) {
        this.socket.emit("newMsg", {txt}, this.current);
        document.getElementById("input").value = "";
    }
}