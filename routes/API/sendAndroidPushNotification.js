var gcm = require('node-gcm');
var models = require('../../models');
var mongoose = require('mongoose');
var deviceUsers = models.DeviceUsers;
var sendPushObj = require('../../routes/core/sendPush');

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
    } else {
        sendPushObj.sendPush(senderId,receiverId,message,'Android');
    }
}