var registerDeviceForPush = require('./registerDeviceForPush'),
    sendIOSPushNotification = require('./sendIOSPushNotification');
	
	
exports.router = function(app) {
    registerDeviceForPush.router(app);
    sendIOSPushNotification.router(app);
}
