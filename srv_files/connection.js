const Hashes = require('jshashes');

module.exports = {
    createAccount: createAccount,
    connect: connect,
    testPsd: testPsd
};

function createAccount(obj, socket, dbo) {
    if (obj.hasOwnProperty("psd") && obj.hasOwnProperty("passwd")) {
        let userName = obj.psd;
        let passwd = new Hashes.SHA256().b64(obj.passwd);
        if (userName.length > 30) {
            socket.emit("fail", "create");
            socket.emit("log", [{
                id: "result",
                msg: "Votre nom de compte ne peut dépasser 30 charactères."
            }]);
        } else if (userName === "") {
            socket.emit("fail", "create");
            socket.emit("log", [{
                id: "result",
                msg: "Veuillez renseigner le champ 'Nom du compte'"
            }]);
        } else if (/\//.test(userName) ) {
            socket.emit("fail", "create");
            socket.emit("log", [{
                id: "result",
                msg: "Erreur, le caractère / est interdit !"
            }]);
        } else if (/\\/.test(userName)) {
            socket.emit("fail", "create");
            socket.emit("log", [{
                id: "result",
                msg: "Erreur, le caractère \\ est interdit !"
            }]);
        } else if (/srv/.test(userName)) {
            socket.emit("fail", "create");
            socket.emit("log", [{
                id: "result",
                msg: "Erreur, votre titre ne peut pas contenir : srv !"
            }]);
        } else if (/mayeul/i.test(userName)) {
            socket.emit("fail", "create");
            socket.emit("log", [{
                id: "result",
                msg: "Erreur, le mot 'Mayeul' est réservé !"
            }]);
        } else {

            dbo.collection("connection").findOne({
                psd: userName
            }, function(err, result) {
                if (err) throw err;
                if (result === null) {
                    const myobj = {
                        psd: userName,
                        passwd: passwd
                    };
                    const accObj = {
                        psd: userName,
                        totalLikes: 0,
                        convs_id: []
                    };
                    dbo.collection("connection").insertOne(myobj, function(err, res) {
                        if (err) throw err;
                        socket.emit("log", [{
                            id: "result",
                            msg: "Votre compte à bien été créé ! \n Votre nom d'utilisateur est " + userName + "."
                        }], true);
                    });
                    dbo.collection("account").insertOne(accObj, function(err, res) {
                        if (err) throw err;
                    });
                } else {
                    socket.emit("fail", "create");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Ce nom d'utilisateur est déjà pris :c"
                    }]);
                }
            });
        }
    }
}

function connect(obj, coSettings, socket, dbo) {
    if (socket.hasOwnProperty("psd")) {
        if (coSettings === "lazy")
            return ;
        socket.emit("fail", "connect");
        socket.emit("log", [{
            id: "result",
            msg: "Vous êtes déjà connecté au nom de "+
            socket.psd+
            ", <u style='' onclick='socket.emit(\"decomoi\"); let direc = sessionStorage.getItem(\"goTo\"); sessionStorage.clear(); localStorage.clear(); sessionStorage.setItem(\"goTo\", direc); document.getElementById(\"result\").innerHTML = \"\";'>Se déconnecter</u>"
        }]);
    } else {
        if (obj.hasOwnProperty("psd") && obj.hasOwnProperty("passwd")) {
            let userName = obj.psd;
            let passwd = new Hashes.SHA256().b64(obj.passwd);
            dbo.collection("connection").findOne({
                psd: userName
            }, function(err, result) {
                if (err) throw err;
                if (result === null) {
                    socket.emit("fail", "connect");
                    socket.emit("log", [{
                        id: "result",
                        msg: "Ce nom de compte n'existe pas..."
                    }]);
                } else {
                    if (passwd === result.passwd) {
                        socket.psd = userName;
                        socket.actionsCount = 0;
                        socket.join(userName);
                        socket.passwd = passwd;
                        socket.emit("log", [{
                            id: "result",
                            msg: "Vous êtes bien connecté !"
                        }]);
                        socket.emit("succes", obj);
                    } else {
                        socket.emit("fail", "connect");
                        socket.emit("log", [{
                            id: "result",
                            msg: "Mot de passe éronné."
                        }]);
                        if (coSettings === "hard") {
                            socket.emit("logAndComeBack");
                        }
                    }
                }
            });
        } else {
            console.log("violation du protocole")
        }
    }
}

function testPsd(psd, num, socket, dbo) {
    if (typeof(psd) === "string" && typeof(num) === "number") {
        dbo.collection("connection").findOne({
            psd: psd
        }, function(err, result) {
            if (err) throw err;
            if (result === null) {
                socket.emit("testPsd", true, num);
            } else {
                socket.emit("testPsd", false, num);
            }
        });
    }
}