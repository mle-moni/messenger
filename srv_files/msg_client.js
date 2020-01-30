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

function newMsg(msg, convIdStr, socket, dbo, io) {
    const convId = new ObjectId(convIdStr);

    if (!checkNewMsg(msg)) {
        socket.emit("log", "Impossible de parser le message.");
        return ;
    }
    const msgObj = {
        time: new Date(),
        user_id: socket.userId.toString(),
        user_msg: msg.txt
    };
    const msgToStore = {
        time: msgObj.time,
        user_id: crypt.aesEncode(msgObj.user_id),
        user_msg: crypt.aesEncode(msgObj.user_msg)
    };

    dbo.collection("conversations").updateOne({_id: convId}, {
        $push: {
            conv_data: msgToStore
        }
    }, function(err, res) {
        if (res.matchedCount == 1) {
            // on a push le nouveau message
            io.to(convIdStr).emit("newMsg", msgObj, convIdStr);
        }
    });
}

// msg object template :
/*
{
    time: new Date(),
    user_id: ObjectId("Bob"),
    user_msg: "Salut"
}
*/

// socket io rooms syntax : 
/*
io.to('some room').emit('some event');
*/