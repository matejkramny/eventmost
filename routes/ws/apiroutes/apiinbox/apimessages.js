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
        .post('/api/inbox/read/:id', readAPI)
        .post('/api/inbox/delete/message/:id', deletemessageAPI)
        .post('/api/inbox/delete/topic/:id', deletetopicAPI)
        .post('/api/inbox/consolidatedAPI/:id', consolidatedAPI)
        .post('/api/inbox/unreadMessages/:id', countUnReadMessages)
    //.get('/api/inbox/message/:id', getMessageAPI, showMessageAPI)
    //.post('/api/inbox/message/:id', getMessageAPI, postMessageAPI)
}

function countUnReadMessages(req, res) {
    var userId = req.params.id;

    if (!userId) {
        res.format({
            json: function () {
                res.send({
                    status: 404,
                    message: "Param id is missing"
                })
            }
        })
    }

    models.Topic.find({users:userId})
        .select('topic')
        .exec(function (err, topics) {
            if(typeof topics != 'undefined') {
                models.Message.find({'topic': {$in: topics}, 'read': false, 'sentBy':userId}).count(function (err, m) {
                    if (m) {
                        res.format({
                            json: function () {
                                res.send({
                                    status: 200,
                                    message: m
                                })
                            }
                        })
                    } else {
                        res.format({
                            json: function () {
                                res.send({
                                    status: 404,
                                    message: "No unread messages found"
                                })
                            }
                        })
                    }
                });
            } else {
                res.format({
                    json: function () {
                        res.send({
                            status: 404,
                            message: "No Topics found against this user"
                        })
                    }
                })
            }
        });
}

function getMessageAPI(req, res) {
    var id = req.params.id;

    if (!id) {
        res.send(404, {status: 404, message: "param id is missing"});
    }

    var query
    if (req.body.read == undefined) {
        query = {topic: req.params.id};
    } else {
        query = {topic: req.params.id, read: req.body.read};
    }

    console.log(query)
    models.Message.find(query)
        //.populate({path: "sentBy", select: 'name'})
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

    if (!req.body || !req.body._id || !req.body._to || !req.body.eventid) {
        res.status(404).send({
            status: 404, message: 'body item missing, either _id, _to or eventid'
        });
        return;
    }

    if (req.body._id == req.body._to) {
        res.status(404).send('To and From are same.');
        return;
    }

    models.User.findById(req.body._id, function (err, userModel) {
        if (err || !userModel) {
            res.status(404).send({
                status: 404, message: "User ID " + req.body._id + " Not Found"
            });
            return;
        }

        models.User.findById(req.body._to, function (err, userModel) {
            if (err || !userModel) {
                res.status(404).send({
                    status: 404, message: "User ID " + req.body._to + " Not Found"
                });
                return;
            }
            checkNewTopic(req.body._id, req.body._to, res, req.body.eventid);
        })
    })
}

exports.checkNewTopic = checkNewTopic = function (uid, to, res, eventtopic) {
    // Find if a topic exists between two.
    var query = {
        $and: [
            {users: {$all: [uid, to]}},
            {eventid: eventtopic}
        ]
    };

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
                                topic: topics[0]._id,
                                eventId: topics[0].eventid
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
                                    topic: newtopic._id,
                                    eventId: newtopic.eventid
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
    newMessage(req.params.id, req.body.message, userid, res);

}

exports.newMessage = newMessage = function (topicID, message, userid, res) {

    models.User.findById(userid, function (err, userModel) {
        console.log(userModel);
        if (!userModel) {
            res.format({
                json: function () {
                    res.send({
                        status: 404,
                        message: "User does not exists or deleted"
                    })
                }
            })
            return;
        }

        models.Topic.findOne({"_id": topicID})
            .select('users lastUpdated eventid')
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
                var touser;
                for (var i = 0; i < topic.users.length; i++) {
                    if (userid == topic.users[i]) {
                        user = topic.users[i];

                    } else {
                        touser = topic.users[i];
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
                    //model.User.
                    //user.mailboxUnread++;
                    models.User.findOneAndUpdate(
                        {_id: touser},
                        {$inc: {mailboxUnread: 1}},
                        {upsert: false},
                        function (err, message) {
                            //console.log(message);
                            if (err) {
                                console.log(err);
                            }

                        });
                    //user.save();
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
                                sent: true,
                                messagObject: msg
                            })
                        }
                    });
                });


            });
    });
}

function showMessagesAPI(req, res) {
    var currentuser = req.body._id;
    if (!currentuser) {
        res.format({
            json: function () {
                res.send({
                    status: 404,
                    message: "User ID not sent: _id"
                })
            }
        });
        return;
    }
    var query = {users: {$in: [currentuser]}};

    // Fetch My Topics.
    models.Topic.find(query)
        .populate({path: "users", match: {_id: {$ne: currentuser}}})
        .select('users lastUpdated eventid')
        .sort('lastUpdated')
        .exec(function (err, topics) {

            if (err) {
                res.format({
                    json: function () {
                        res.send({
                            status: 404,
                            message: err
                        })
                    }
                });
            }

            if (!topics) {
                res.format({
                    json: function () {
                        res.send({
                            status: 404,
                            message: "Unable to find any topic"
                        })
                    }
                });
            }

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

function readAPI(req, res) {
    messageid = req.params.id;

    var query = {_id: messageid}
    models.Message.findOneAndUpdate(query, {$set: {read: true}}, {upsert: true}, function (err, message) {
        if (err) return res.send(500, {error: err})
        return res.send(200, {status: 200})
    });
}

function deletemessageAPI(req, res) {
    var query = {_id: req.params.id}
    models.Message.find(query).remove().exec();
    res.send(200, {status: 200});
}

function deletetopicAPI(req, res) {
    var query = {_id: req.params.id};
    models.Topic.find(query).remove().exec();

    query = {topic: req.params.id}
    models.Message.find(query).remove().exec();
    res.send(200, {status: 200});
}

function consolidatedAPI(req, res) {
    var userId = req.params.id;
    var query = {users: {$in: [userId]}};

    var events = [];
    var receivedBusinessCards = [];
    var savedProfile = [];
    var saverProfile = [];
    var topics = [];
    var topicsArray = [];
    var messages = [];
    models.Attendee.find({'user': userId}, '_id', function (err, attendees) {
        var query = {'attendees': {$in: attendees}};

        models.Event.find(query)
            .populate('attendees.user')
            .select('name start end address venue_name avatar source description avatar')
            .sort('-created')
            .exec(function (err, evs) {
                if (err) throw err;
                events = evs;

                models.User.find({_id: userId})
                    .populate('receivedCards.card receivedCards.from receivedCards.eventid')
                    .select('receivedCards.card receivedCards.from receivedCards.eventid receivedCards.sent')
                    .exec(function (err, businessCard) {
                        receivedBusinessCards = businessCard;

                        models.User.findOne({_id: userId})
                            .populate('savedProfiles._id', '-receivedCards -savedProfiles')
                            .exec(function (err, savedProfileUser) {
                                if (savedProfileUser) {
                                    var query = {'_id': {$in: savedProfileUser.savedProfiles}};
                                    savedProfile = savedProfileUser.savedProfiles;
                                }
                                var saverQuery = {'savedProfiles._id': userId};
                                models.User.find(saverQuery)
                                    .select('-receivedCards')
                                    .exec(function (err, saverprofiles) {
                                        if (err) throw err;
                                        saverProfile = saverprofiles;
                                        var query = {users: {$in: [userId]}};
                                        models.Topic.find(query)
                                            .populate({path: "users", match: {_id: {$ne: userId}}})
                                            .select('users lastUpdated eventid')
                                            .sort('lastUpdated')
                                            .exec(function (err, topicsUser) {
                                                topics = topicsUser;
                                                topicsUser.forEach(function (topic) {
                                                    topicsArray.push(topic._id);
                                                });
                                                var msgQuery;
                                                msgQuery = {topic: {$in: topicsArray}};
                                                models.Message.find(msgQuery)
                                                    .populate({path: "sentBy", select: 'name'})
                                                    .select('message timeSent sentBy topic')
                                                    .sort({"timesent": 1})
                                                    .exec(function (err, topicmessages) {
                                                        messages = topicmessages;
                                                        generateJSON(JSON.parse(JSON.stringify(events)),
                                                            JSON.parse(JSON.stringify(receivedBusinessCards)),
                                                            JSON.parse(JSON.stringify(savedProfile)),
                                                            JSON.parse(JSON.stringify(saverProfile)),
                                                            JSON.parse(JSON.stringify(topics)),
                                                            JSON.parse(JSON.stringify(messages)), req, res, userId);
                                                    })

                                            })
                                    })
                            })
                    })
            })

    });
}

var generateJSON = function (events, receivedBusinessCards, savedProfile, saverProfile, topics, messages, req, res, userId) {
    var jsonMainObject = {};
    var jsonEventArray = [];
    var jsonConsolidatedChat = [];
    var jsonConsolidatedCardObject = {};
    var jsonConsolidatedSavedProfileObject = {};
    var jsonConsolidatedSaverProfileObject = {};
    var jsonConsolidatedMessageObject = {};
    var jsonChatObject = {};
    var flag = false;
    var eventIds = [];
    for (var i = 0; i < events.length; i++) {
        jsonConsolidatedCardObject = {};
        jsonConsolidatedChat = [];
        jsonConsolidatedSavedProfileObject = {};
        jsonConsolidatedMessageObject = {};
        jsonConsolidatedCardObject["card"] = [];
        jsonChatObject = {};
        jsonChatObject["chats"] = [];
        jsonConsolidatedSaverProfileObject["user"] = [];
        jsonConsolidatedMessageObject["message"] = [];
        jsonConsolidatedMessageObject["user"] = [];
        var cu = receivedBusinessCards[0];

        if (cu.receivedCards.length == 0) {
            jsonConsolidatedCardObject["card"] = [];
            jsonConsolidatedChat.push(jsonConsolidatedCardObject);
        } else {
            for (var j = 0; j < cu.receivedCards.length; j++) {
                if (typeof cu.receivedCards[j].eventid !== "undefined" && cu.receivedCards[j].eventid != null) {
                    if (events[i]._id == cu.receivedCards[j].eventid._id) {
                        jsonConsolidatedCardObject["card"].push(cu.receivedCards[j].card);
                    }
                }
            }
            jsonConsolidatedChat.push(jsonConsolidatedCardObject);
        }

        if (saverProfile.length == 0) {
            jsonConsolidatedSaverProfileObject["user"] = [];
            jsonConsolidatedChat.push(jsonConsolidatedSaverProfileObject);
        } else {
            for (var l = 0; l < saverProfile.length; l++) {
                for (var p = 0; p < saverProfile[l].savedProfiles.length; p++) {
                    if (events[i]._id === saverProfile[l].savedProfiles[p].eventid) {
                        jsonConsolidatedSaverProfileObject["user"].push(saverProfile[l]);
                    }
                }
            }
            jsonConsolidatedChat.push(JSON.parse(JSON.stringify(jsonConsolidatedSaverProfileObject)));
        }

        if (topics.length == 0) {
            flag = false;
        } else {
            for (var m = 0; m < topics.length; m++) {
                if (events[i]._id == topics[m].eventid) {
                    flag = true;
                    jsonConsolidatedMessageObject["topicId"] = topics[m]._id;
                    if (messages.length == 0) {
                        jsonConsolidatedMessageObject["message"];
                        jsonChatObject["chats"].push(jsonConsolidatedMessageObject);
                        jsonConsolidatedMessageObject = {};
                        jsonConsolidatedMessageObject["message"] = [];
                    } else {
                        for (var n = 0; n < messages.length; n++) {
                            if (topics[m]._id == messages[n].topic) {
                                jsonConsolidatedMessageObject["message"].push(messages[n]);
                                flag = true;
                            }
                        }

                        for (var o = 0; o < topics[m].users.length; o++) {
                            if (topics[m].users[o]._id != userId) {
                                delete topics[m].users[o].savedProfiles;
                                delete topics[m].users[o].receivedCards;
                                jsonConsolidatedMessageObject["user"] = topics[m].users[o];
                                jsonChatObject["chats"].push(jsonConsolidatedMessageObject);
                                flag = true;
                            }
                        }

                        flag = true;
                    }

                } else {
                }
                if (flag == true) {
                    jsonConsolidatedMessageObject = {};
                    jsonConsolidatedMessageObject["message"] = [];
                    jsonConsolidatedMessageObject["user"] = [];
                }
            }

            if (flag == true) {
                jsonConsolidatedChat.push(jsonChatObject);
                var obj = JSON.parse(JSON.stringify(events[i]));
                obj["consolidatedChats"] = jsonConsolidatedChat;
                jsonEventArray.push(obj);
            }

        }


        if (flag == false) {
            jsonConsolidatedMessageObject["message"];
            jsonChatObject["chats"].push(jsonConsolidatedMessageObject);
            jsonConsolidatedChat.push(jsonChatObject);
            var obj = JSON.parse(JSON.stringify(events[i]));
            obj["consolidatedChats"] = jsonConsolidatedChat;
            jsonEventArray.push(obj);

        }

    }

    jsonMainObject["status"] = 200;
    jsonMainObject["events"] = jsonEventArray;

    res.format({
        json: function () {
            res.send(jsonMainObject);
        }
    });
};