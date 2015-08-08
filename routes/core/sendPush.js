var apn = require('apn');
var gcm = require('node-gcm');
var models = require('../../models');
var mongoose = require('mongoose');
var deviceUsers = models.DeviceUsers;


exports.sendPush = function(senderId, receiverId, message, deviceType){
    if(deviceType === 'iPhone') {
        console.log("in iphone function.");
        sendIOSPush(senderId,receiverId,message);
    } else if(deviceType === 'Android') {
        sendAndroidPush(senderId,receiverId,message);
    }
}
var apnError = function(err){
    console.log("APN Error:", err);
}
function sendIOSPush(senderId, receiverId, message) {
    var status = true;
    var msg;
    var desc;
    deviceUsers.findOne({deviceUser:receiverId,deviceType:'iPhone'}).select({deviceToken:1}).exec(function (err, token){
        if(err) return err;
        try{
            if(token){
                console.log(token);
                var options = {
                    //"pfx": "E:/software/iOS Push certificate/aps_development.p12",
                    "pfx": "public/certificate/aps_development.p12",
                    "passphrase": "eventmost",
                    "gateway": "gateway.sandbox.push.apple.com",
                    "port": 2195,
                    "enhanced": true,
                    "cacheLength": 5
                };
                //options.errorCallback = apnError;

                var apnConnection = new apn.Connection(options);
                //var myDevice = new apn.Device("606a9f3e90ce1703c58f1516c5a8839a0fd06b6c25bbdfcbc075aca25a945d87");
                var myDevice = new apn.Device(token.deviceToken);
                var note = new apn.Notification();

                note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
                note.badge = 3;
                note.sound = "ping.aiff";
                note.alert = "\uD83D\uDCE7 \u2709 You have a new message from senderId " + senderId;
                note.payload = {'messageFrom': message};

                if(apnConnection) {
                    apnConnection.pushNotification(note, myDevice);
                }

                apnConnection.on("transmitted", function(notification, device) {
                    console.log("Notification transmitted to:" + device.token.toString("hex"));
                    console.log("Notification Detail: " + JSON.stringify(notification));
                    msg = "Notification transmitted to:" + device.token.toString("hex");
                    status = true;
                    //sendJSON(msg,null);
                });

                apnConnection.on("transmissionError", function(errCode, notification, device) {
                    console.error("Notification caused error: " + errCode + " for device ", device, notification);
                    msg = "Notification caused error: " + errCode + " for device ";
                    if (errCode === 8) {
                        console.log("A error code of 8 indicates that the device token is invalid. This could be for a number of reasons - are you using the correct environment? i.e. Production vs. Sandbox");
                        desc = "A error code of 8 indicates that the device token is invalid";
                        status = false;
                        //sendJSON(msg,desc);
                    }
                });

                apnConnection.on("timeout", function () {
                    console.log("Connection Timeout");
                });

                apnConnection.on("disconnected", function() {
                    console.log("Disconnected from APNS");
                });

                apnConnection.on("socketError", console.error);
                //TODO: No need to send json as apn is already handeling this. Some kind of test tool to be created to test push from rest client
                function sendJSON(msg,desc){
                    //return function(){
                    if(status) {
                        res.format({
                            json: function() {
                                res.send({
                                    status: 200,
                                    messages: msg
                                })
                            }
                        })
                    } else {
                        res.format({
                            json: function() {
                                res.send({
                                    status: 404,
                                    messages: msg,
                                    description: desc
                                })
                            }
                        })
                    }
                    //}

                }
                //TODO: Need to improve more logging
                /*function log(type) {
                 return function() {
                 console.log(type, arguments);
                 if(type == 'transmissionError') {
                 res.send(arguments);
                 }
                 }
                 }

                 apnConnection.on('error', log('error'));
                 apnConnection.on('transmitted', log('transmitted'));
                 apnConnection.on('timeout', log('timeout'));
                 apnConnection.on('connected', log('connected'));
                 apnConnection.on('disconnected', log('disconnected'));
                 apnConnection.on('socketError', log('socketError'));
                 apnConnection.on('transmissionError', log('transmissionError'));
                 apnConnection.on('cacheTooSmall', log('cacheTooSmall'));*/
            } else {
                res.format({
                    json: function() {
                        res.send({
                            status: 404,
                            messages: "No token found against the receiverId"
                        })
                    }
                })
            }
        } catch(ex) {
            console.log(ex);
        }

    });
}

function sendAndroidPush(senderId, receiverId, message) {
    var message = new gcm.Message();
    deviceUsers.findOne({deviceUser:receiverId,deviceType:'Android'}).select({deviceToken:1}).exec(function (err, token){
        if (err) return err;

        if(token) {
            message.addNotification('title', 'You have a new message from senderId ' + senderId);
            message.addData('key1', message);

            var regIds = [];

            regIds.push(token.deviceToken);

            //TODO: Need an android app key
            var sender = new gcm.Sender('AIzaSyC8r1IGFX_dfSHP1d8O1m__88zAA1QtkVU');

            sender.send(message, regIds, function (err, result) {
                if(err) console.error(err);
                else    console.log(result);
            });

            sender.sendNoRetry(message, regIds, function (err, result) {
                if(err) console.error(err);
                else    console.log(result);
            });
        } else {
            res.format({
                json: function() {
                    res.send({
                        status: 404,
                        messages: "No token found against the receiverId"
                    })
                }
            })
        }
    })
}
