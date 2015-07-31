/**
 * Created with JetBrains WebStorm.
 * User: Sulaiman
 * Date: 3/11/15
 * Time: 9:54 PM
 * To change this template use File | Settings | File Templates.
 */

var mongoose = require('mongoose');

var schema = mongoose.Schema;
var ObjectId = schema.ObjectId;

var deviceUsers = new schema({
    deviceUser: {
        type: ObjectId,
        ref: 'User'
    },
    //deviceUser: String,
    deviceType : String,
    deviceOs : String,
    osVersion : String,
    deviceModel : String,
    deviceToken : String,
    lastUpdatedTimeStamp : {type: Date, default: Date.now},
    registrationTimeStamp:{type: Date, default: Date.now}
});
exports.DeviceUsers = mongoose.model("DeviceUsers", deviceUsers);
