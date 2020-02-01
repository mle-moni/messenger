class ConvObject {
    constructor() {
        this.conversations = [];
        this.current = "";
    }
    newConv(conv) {
        const convList = document.getElementById("conv_list");
        const p = document.createElement("p");

        this.conversations[conv._id] = conv;
        p.classList.add("clickable", "conv_name_list");
        p.onclick = e=>{
            // console.log(e.target)
            this.loadConv(e.target.convID);
            this.hideConvList();
        }
        p.innerText = conv.conv_name;
        p.convID = conv._id;
        convList.appendChild(p);
    }
    hideConvList() {
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

        p.innerText = `${time.getHours()}h${time.getMinutes()} - ${msgObj.user_id} : ${msgObj.user_msg}`;
        // p.classList.add()
        msgList.appendChild(p);
    }
}