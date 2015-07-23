var models = require('../../models');
var deviceUsers = models.DeviceUsers;
var mongoose = require('mongoose');

function GenericRegisterDeviceClass(userId,deviceType,deviceOS,OSVersion,deviceModel,deviceToken){
    this.userId = userId;
    this.deviceType = deviceType;
    this.deviceOS = deviceOS;
    this.OSVersion = OSVersion;
    this.deviceModel = deviceModel;
    this.deviceToken = deviceToken;
}

GenericRegisterDeviceClass.prototype.genericRegisterDevice = function(req,res,userId,deviceType,deviceOS,OSVersion,deviceModel,deviceToken){
    console.log(this.userId + " " + this.deviceType + " " + this.deviceOS + " " + this.OSVersion + " " +
    this.deviceModel + " " + this.deviceToken);

    deviceUsers.findOne({deviceUser:userId,deviceType:deviceType},function(err,user){
        if(err) throw err;
        if(user) {
            console.log("in update: ");
            deviceUsers.update({deviceUser:userId},{$set:{deviceOS:deviceOS,osVersion:OSVersion,
                deviceModel:deviceModel,deviceToken:deviceToken}},function(err,registerDevice){
                if (err) throw err;

                if(registerDevice != null){
                    console.log(registerDevice)
                    res.status(200);
                    res.json({status:200,message:"Device is successfully updated"});
                }
            })
        } else {
            new deviceUsers({
                deviceUser : userId,
                deviceType : deviceType,
                deviceOS : deviceOS,
                osVersion : OSVersion,
                deviceModel : deviceModel,
                deviceToken : deviceToken
            }).save(function(err,registerDevice,count){
                    if (err) throw err;
                    if(registerDevice != null){
                        console.log("hello")
                        res.status(200);
                        res.json({status:200,message:"Device is successfully registered",trackingId:registerDevice._id,
                            userId:registerDevice.deviceUser});
                    }
                });
        }
    })
}

module.exports = GenericRegisterDeviceClass;