class ConvObject {
    constructor(socket) {
        this.socket = socket;
        this.conversations = [];
        this.usersTable = [];
        this.current = "";
        this.newConvUsers = [];
        document.getElementById("input").addEventListener("keydown", e=>{
            if (e.keyCode === 13) {
                this.sendMsg(document.getElementById("input").value);
            }
        });
        document.getElementById("add_conv_button").onclick = e=>{
            console.log("cette fonction n'est pas encore disponible !")
            // document.body.classList.replace("body_show_list", "body_show_create");
            // document.getElementById("create_conv").style.display = "block";
            // document.getElementById("chose_conv").style.display = "none";
        };
        // document.getElementById("input_get_users").addEventListener("keyup", e=>{
        //     this.socket.emit("getUsers", document.getElementById("input_get_users").value);
        // });
        // let self = this;
        // document.getElementById("create_conv_submit").addEventListener("click", e=>{
        //     self.createConv();
        // });
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
                // console.log(e.target)
                this.loadConv(e.target.convID);
                this.showConv();
            }
            p.innerText = conv.conv_name;
            p.convID = conv._id;
            convList.appendChild(p);
        }
        this.conversations[conv._id] = conv;
    }
    showConv() {
        if (window.innerWidth <= 700) {
            toggleMenuVisibility();
        }
        document.getElementById("msg_list").scroll(0, 10000000);
    }
    loadConv(convID) {
        const currentConv = this.conversations[convID];
        
        this.current = convID;
        document.getElementById("conv_name").getElementsByTagName("h1")[0].innerText = currentConv.conv_name;
        console.log("ajouter la liste d'utilisateurs")
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
        if (userName === sessionStorage.psd) {
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
        }
    }
    updateUsersTable(userObj) {
        this.usersTable[userObj._id] = userObj.psd;
    }
    sendMsg(txt) {
        this.socket.emit("newMsg", {txt}, this.current);
        document.getElementById("input").value = "";
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
            console.log(this)
            this.socket.emit("createConv", this.newConvUsers.map(o=>o._id), convName);
            showConvList();
        }
    }
}