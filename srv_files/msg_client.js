const ObjectId = require('mongodb').ObjectId;
const crypt = require("../../global/crypt");
const unread = require("./unread");

module.exports = {
    newMsg,
    readMsg,
    getUnread
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
        socket.emit("error!", "Impossible de parser le message.");
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

    dbo.collection("conversations").findOne({ $and: [
        {conv_users: { $all: [ socket.userId ]}},
        {_id: convId}
    ]}, function(err, conversation) {
        if (!conversation) {
            socket.emit("error!", "Cant find conversation..");
            return ;
        }
        dbo.collection("conversations").updateOne({_id: convId}, {
            $push: {
                conv_data: msgToStore
            }
        }, function(err, res) {
            if (res.matchedCount == 1) {
                // on a push le nouveau message
                msgObj.user_id = crypt.encode(msgObj.user_id);
                io.to(convIdStr).emit("newMsg", msgObj, convIdStr);
                // on set le nombre de message non lus
                for (let i = 0; i < conversation.conv_users.length; i++) {
                    let userIdStr = conversation.conv_users[i].toString();
                    unread.inc(userIdStr, convIdStr, dbo);
                }
            }
        });
    });
}

function readMsg(convIdStr, socket, dbo) {
    unread.empty(socket.userId.toString(), convIdStr, dbo);
}

function getUnread(socket, dbo) {
    unread.getObj(socket, dbo);
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