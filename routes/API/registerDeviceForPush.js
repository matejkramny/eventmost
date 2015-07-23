var models = require('../../models');
var mongoose = require('mongoose');
var GenericRegisterDevice = require('../../routes/core/GenericRegisterDevice');

exports.router = function (app) {
    app.post('/api/registerIOSDevice', registerIOSDevice)
    app.post('/api/registerAndroidDevice', registerAndroidDevice);
}

function registerIOSDevice(req,res){
    console.log(req.param('userId'));
    if(typeof(req.param('userId')) == "undefined" || typeof(req.param('deviceOS')) == "undefined"
        || typeof(req.param('OSVersion')) == "undefined" || typeof(req.param('deviceModel')) == "undefined"
        || typeof(req.param('deviceToken')) == "undefined") {
        res.status(400);
        res.json({result:"Mandatory parameter required"});
    } else {
        var genericRegisterDeviceObj = new GenericRegisterDevice(req.param('userId'),"iPhone",req.param('deviceOS'),
        req.param('OSVersion'),req.param('deviceModel'),req.param('deviceToken'));
        genericRegisterDeviceObj.genericRegisterDevice(req,res,req.param('userId'),"iPhone",req.param('deviceOS'),
            req.param('OSVersion'),req.param('deviceModel'),req.param('deviceToken'));
    }
}

function registerAndroidDevice(req,res){
    res.set('Content-Type', 'application/json');
    if(typeof(req.param('userId')) == "undefined" || typeof(req.param('deviceOS')) == "undefined"
        || typeof(req.param('OSVersion')) == "undefined" || typeof(req.param('deviceModel')) == "undefined"
        || typeof(req.param('deviceToken')) == "undefined") {
        res.status(400);
        res.json({result:"Mandatory parameter required"});
    } else {
        var genericRegisterDeviceObj = new GenericRegisterDevice(req.param('userId'),"Android",req.param('deviceOS'),
        req.param('OSVersion'),req.param('deviceModel'),req.param('deviceToken'));
        genericRegisterDeviceObj.genericRegisterDevice(req,res,req.param('userId'),"Android",req.param('deviceOS'),
            req.param('OSVersion'),req.param('deviceModel'),req.param('deviceToken'));
    }
}

