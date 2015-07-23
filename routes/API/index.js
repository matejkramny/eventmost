var registerDeviceForPush = require('./registerDeviceForPush');
	
	
exports.router = function(app) {
    registerDeviceForPush.router(app);
}
