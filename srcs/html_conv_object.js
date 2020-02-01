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
            console.log(e.target)
            this.hideConvList();
        }
        p.innerText = conv.conv_name;
        p.targetID = conv._id;
        convList.appendChild(p);
    }
    hideConvList() {
        const choseConv = document.getElementById("chose_conv");

        document.body.classList.replace("body_show_list", "body_show_conv");
        choseConv.style.display = "none";
        document.getElementById("conversation").style.display = "grid";
    }
}