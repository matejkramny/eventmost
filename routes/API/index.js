var registerDeviceForPush = require('./registerDeviceForPush'),
    sendIOSPushNotification = require('./sendIOSPushNotification'),
    sendAndroidPushNotification = require('./sendAndroidPushNotification');
	
	
exports.router = function(app) {
    registerDeviceForPush.router(app);
    sendIOSPushNotification.router(app);
    sendAndroidPushNotification.router(app);
}
