var fs = require('fs')
    , models = require('../../../../models')
    , mongoose = require('mongoose')
    , util = require('../../util')
    , async = require('async')
    , inbox = require('./index')

exports.router = function (app) {
    app.post('/api/inbox/messages', showMessagesAPI)
        .post('/api/inbox/messages/:id/new', doNewMessageAPI)
        .post('/api/inbox/topic/:id', getMessageAPI)
        .post('/api/inbox/topics/new', newTopic)
        .post('/api/inbox/read/:id',readAPI)
        .post('/api/inbox/delete/message/:id', deletemessageAPI)
        .post('/api/inbox/delete/topic/:id', deletetopicAPI)
    //.get('/api/inbox/message/:id', getMessageAPI, showMessageAPI)
    //.post('/api/inbox/message/:id', getMessageAPI, postMessageAPI)
}

function getMessageAPI(req, res) {
    var id = req.params.id;
    var query
    if (req.body.read == undefined) {
        query = {topic: req.params.id};
    } else {
        query = {topic: req.params.id, read: req.body.read};
    }

    console.log(query)
    models.Message.find(query)
        .populate({path: "sentBy", select: 'name'})
        .select('message timeSent sentBy')
        .sort({"timesent": 1})
        .exec(function (err, topicmessages) {

            res.format({
                json: function () {
                    res.send({
                        status: 200,
                        messages: topicmessages
                    })
                }
            });
        });
}

function newTopic(req, res) {

    if (req.body._id == req.body._to) {
        res.status(404).send('To and From are same.');
        return;
    }

    if(req.eventid == null){
        res.status(404).send("EventID is missing");
    }

    checkNewTopic(req.body._id, req.body._to, res, req.body.eventid);
}

exports.checkNewTopic = checkNewTopic = function (uid, to, res, eventtopic) {
    // Find if a topic exists between two.
    var query = [
        {users: {$all: [uid, req.body.to]}}
        {eventid: eventtopic}
    ];

    // Fetch My Topics.
    models.Topic.find(query)
        .select('users lastUpdated eventid')
        .sort('lastUpdated')
        .exec(function (err, topics) {

            if (topics.length > 0) // Topic is already created.
            {
                if (res) {
                    res.format({
                        json: function () {
                            res.send({
                                status: 200,
                                message: "Topic Already created",
                                topic: topics[0]._id
                            });
                        }
                    });
                } else {
                    return topics[0]._id;
                }

                return;
            }
            else // No topics found
            {
                var newtopic = new models.Topic({
                    lastUpdated: Date.now(),
                    users: [uid, to],
                    eventid: eventtopic
                });


                newtopic.save(function (err) {
                    if (res) {
                        res.format({
                            json: function () {
                                res.send({
                                    status: 200,
                                    sent: true,
                                    topic: newtopic._id
                                });
                            }
                        });
                    } else {
                        return newtopic._id;
                    }
                });
            }
        });
}

function showMessageAPI(req, res) {



    // var otherUser = null;
    // for (var i = 0; i < res.locals.message.users.length; i++) {
    // if (!req.user._id.equals(res.locals.message.users[i]._id)) {
    // otherUser = res.locals.message.users[i];
    // break;
    // }
    // }
// 	
    // var name = "Private Message"
    // if (otherUser)
    // name = "PM to "+otherUser.getName();
// 		
    // res.format({
    // json: function() {
    // res.send({
    // message: res.locals.message,
    // messages: res.locals.messages
    // })
    // }
    // })
}

 function postMessageAPI(req, res) {

    var id = req.params.id;
    var text = req.body.message;

    // check if can make messages
    if (req.session.loggedin_as_user_locals != null && req.session.loggedin_as_user_locals.inbox_send_disabled === true) {
        res.format({
            json: function () {
                res.send({
                    status: 404,
                    message: "Disabled"
                })
            }
        })
        return;
    }

    if (text.length == 0) {
        res.format({
            json: function () {
                res.send({
                    status: 403,
                    message: "Too short"
                })
            }
        })
        return;
    }

    var message = res.locals.message
    if (message) {
        var isUser = false;
        for (var i = 0; i < message.users.length; i++) {
            if (message.users[i]._id.equals(req.user._id)) {
                isUser = true;
                break;
            }
        }

        if (!isUser) {
            req.session.flash.push("Unauthorized");
            res.redirect('/')
            return;
        }

        //Updating User's notification
        for (var i = 0; i < message.users.length; i++) {
            var u = message.users[i];

            // dont update this user
            if (u._id.equals(req.user._id)) continue;

            u.mailboxUnread++;

            u.save();
        }

        message.lastUpdated = Date.now();
        message.save(function (err) {
            if (err) throw err;
        });

        var msg = new models.Message({
            topic: message._id,
            message: text,
            read: false,
            timeSent: Date.now(),
            sentBy: req.user._id
        })

        var notAlertedUsers = inbox.pushMessageToSockets({
            message: {
                _id: msg._id,
                topic: msg.topic,
                message: msg.message,
                read: msg.read,
                timeSent: msg.timeSent,
                sentBy: req.user
            },
            topic: message
        });

        for (var i = 0; i < notAlertedUsers.length; i++) {
            var u = notAlertedUsers[i];
            // These people are not connected by WS, so they're offline..
            if (u.notification.email.privateMessages) {
                inbox.emailMessageNotification(u, req.user, "inbox", "Message from <strong>" + req.user.getName() + "</strong>: " + msg.message);
            }
        }

        msg.save(function (err) {
            res.format({
                json: function () {
                    res.send({
                        sent: true
                    })
                }
            });
        })
    } else {
        // 404

        res.format({
            json: function () {
                res.send({
                    status: 404
                })
            }
        })
    }
}

function doNewMessageAPI(req, res) {

    var userid = req.body.uid;
    if (!userid) {
        res.format({
            json: function () {
                res.send({
                    status: 403,
                    message: "uid not present"
                })
            }
        })
        return;
    }

    if (req.body.message && req.body.message.length == 0) {
        res.format({
            json: function () {
                res.send({
                    status: 403,
                    message: "Too short"
                })
            }
        })
        return;
    }
    newMessage(req.params.id, req.body._message, userid, res);

}

exports.newMessage = newMessage = function(topicID,message,userid, res){

    models.Topic.findOne({"_id": topicID})
        .populate("users")
        .exec(function (err, topic) {

            //Find Topic
            if (!topic) {
                res.format({
                    json: function () {
                        res.send({
                            status: 404,
                            message: "Topic does not exist"
                        })
                    }
                })
                return;
            }

            //Find if User ID is allowed or exists in Topic to post
            var user;
            for (var i = 0; i < topic.users.length; i++) {
                if (userid == topic.users[i]._id) {
                    user = topic.users[i];
                    break;
                }
            }
            if (!user) {
                res.format({
                    json: function () {
                        res.send({
                            status: 404,
                            message: "Unautorized"
                        })
                    }
                })
                return;
            } else {
                user.mailboxUnread++;
                user.save();
            }

            //Do the thing
            var msg = new models.Message({
                topic: topicID,
                message: message,
                read: false,
                timeSent: Date.now(),
                sentBy: userid
            })

            topic.lastUpdated = Date.now();
            topic.save();

            msg.save(function (err) {
                res.format({
                    json: function () {
                        res.send({
                            status: 200,
                            sent: true
                        })
                    }
                });
            });


        });


}

function showMessagesAPI(req, res) {
    var currentuser = req.body._id;
    var query = {users: {$in: [currentuser]}};

    // Fetch My Topics.
    models.Topic.find(query)
        .populate({path: "users", match: {_id: {$ne: currentuser}}})
        .select('users lastUpdated eventid')
        .sort('lastUpdated')
        .exec(function (err, topics) {
            res.format({
                json: function () {
                    res.send({
                        status: 200,
                        topics: topics
                    })
                }
            });

        });
}

function readAPI(req,res){
    messageid = req.params.id;

    var query = {_id: messageid}
    models.Message.findOneAndUpdate(query, { $set: { read: true }}, {upsert:true},function(err, message){
        if(err) return res.send(500, {error: err})
        return res.send(200)
    });
}

function deletemessageAPI(req,res){
    var query = {_id: req.params.id}
    models.Message.find(query).remove().exec();
    res.send(200);
}

function deletetopicAPI(req,res){
    var query = {_id: req.params.id};
    models.Topic.find(query).remove().exec();

    query = {topic: req.params.id}
    models.Message.find(query).remove().exec();
    res.send(200);
}