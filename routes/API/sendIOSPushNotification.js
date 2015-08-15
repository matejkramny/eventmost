var apn = require('apn');
var models = require('../../models');
var mongoose = require('mongoose');
var deviceUsers = models.DeviceUsers;
var sendPushObj = require('../../routes/core/sendPush');

exports.router = function (app) {
    app.post('/api/sendIOSPush',sendIOSPush)
        .post('/api/sendPushNotificationToAttendees',sendPushNotificationToAttendees)
}

function sendIOSPush(req,res){
    var senderId = req.body.senderId;
    var receiverId = req.body.receiverId;
    var message = req.body.message;

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
        sendPushObj.sendPush(senderId,receiverId,message,'iPhone');
    }

}

function sendPushNotificationToAttendees(req,res) {
    var senderId = req.body.senderId;
    var eventId = req.body.eventId;
    var message = req.body.message;
    var userArray = [];
    var iOSTokenArray = [];
    var androidTokenArray = [];
    models.Event.findOne({_id:eventId},function(err,event){
       if(event){
           var query = {'_id': {$in: event.attendees}, 'isAttending': true};

           models.Attendee.find(query)
               .lean()
               .populate({path: 'user'})
               .populate('user', '_id')
               .select('user')
               .exec(function(err,attendee){
                  if(attendee){
                      attendee.forEach(function(att){
                          userArray.push(att.user._id);
                      })
                      models.DeviceUsers.find({'deviceUser':{$in:userArray}},{deviceToken:1,deviceType:1},function(err,user){
                        if(user){
                            user.forEach(function(token){
                                if(token.deviceType == 'iPhone') {
                                    iOSTokenArray.push(token.deviceToken);
                                } else if(token.deviceType == 'Android') {
                                    androidTokenArray.push(token.deviceToken);
                                }
                            });
                            if(iOSTokenArray) {
                                sendPushObj.sendIOSPushNotificationToAtendees(senderId,iOSTokenArray,message);
                            } if(androidTokenArray) {
                                sendPushObj.sendAndroidPushNotificationToAtendees(senderId,androidTokenArray,message);
                            }
                            /*res.format({
                                json: function() {
                                    res.send({
                                        status: 200,
                                        deviceIOSToken: iOSTokenArray,
                                        deviceAndroidToken: androidTokenArray
                                    })
                                }
                            });*/
                        }
                      });
                  }
               });
       } else {
           res.format({
               json: function() {
                   res.send({
                       status: 404,
                       message: "No Event Found!"
                   })
               }
           });
       }
    });
}
