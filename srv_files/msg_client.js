const ObjectId = require('mongodb').ObjectId;
const crypt = require("../../global/crypt");

module.exports = {
    newMsg
};

function checkNewMsg(msg) {
    if (msg.hasOwnProperty("txt")) {
        return (true);
    }
    return (false);
}

function newMsg(msg, convId, socket, dbo) {
    if (!checkNewMsg(msg)) {
        socket.emit("log", "Impossible de parser le message.");
        return ;
    }
}

// msg object template :
/*
{
    time: new Date(),
    user_id: ObjectId("Bob"),
    user_msg: "Salut"
}
*/