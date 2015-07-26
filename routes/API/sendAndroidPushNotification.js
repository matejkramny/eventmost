var gcm = require('node-gcm');
var models = require('../../models');
var mongoose = require('mongoose');
var deviceUsers = models.DeviceUsers;

exports.router = function (app) {
    app.post('/api/sendAndroidPush',sendAndroidPush)
}

function sendAndroidPush(req,res) {
    var senderId = req.body.senderId;
    var receiverId = req.body.receiverId;
    var message = req.body.message;

    var message = new gcm.Message();

    if (typeof(req.param('receiverId')) == "undefined" || typeof(req.param('senderId')) == "undefined" || typeof(req.param('message')) == "undefined") {
        // Error
        res.format({
            json: function() {
                res.send({
                    status: 403,
                    message: "receiverId, senderId and message must contain information"
                })
            }
        })
        return;
    }
    deviceUsers.findOne({deviceUser:receiverId,deviceType:'Android'}).select({deviceToken:1}).exec(function (err, token){
        if (err) return err;

        if(token) {
            message.addNotification('title', 'You have a new message from senderId ' + senderId);
            message.addData('key1', message);

            var regIds = [];

            regIds.push(token.deviceToken);

            //TODO: Need an android app key
            var sender = new gcm.Sender('YOUR_API_KEY_HERE');

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