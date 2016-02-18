"use strict";
// ParsePushAdapter is the default implementation of
// PushAdapter, it uses GCM for android push and APNS
// for ios push.

const Parse = require('parse/node').Parse;
const AfpGCM = require('./AfpGCM');
const AfpAPNS = require('./AfpAPNS');

function AfpParsePushAdapter(pushConfig) {
	this.validPushTypes = ['ios', 'android'];
	this.senderMapByAppId = {};

	pushConfig = pushConfig || {};

	let bundleIds = Object.keys(pushConfig);

	// Enumerate all bundleId
	for (let bundleId of bundleIds) {
		console.log(bundleId);

		// Get push config for current bundleId
		let config = pushConfig[bundleId];

		// Check for each valid pushType
		for (let pushType of Object.keys(config)) {
			console.log(pushType);

			if (this.validPushTypes.indexOf(pushType) < 0) {
				console.log('Push to ' + pushTypes + ' is not supported');

				throw new Parse.Error(Parse.Error.PUSH_MISCONFIGURED, 'Push to ' + pushTypes + ' is not supported');
			}
			else {
				let configByPushType = confgi[pushType];
				let byBundleID = this.senderMapByAppId[bundleId];

				// Reinject bundleId
				configByPushType["bundleId"] = bundleId;

				if (!byBundleID)
				{
					console.log("byBundleID undefined");
					byBundleID = this.senderMapByAppId[bundleId] = {};
				}

				let byPushType = byBundleID[pushType];

				if (!byPushType)
				{
					console.log("byPushType is undefined");
					byPushType = byBundleID[pushType] = [];
				}

				switch (pushType) {
					case 'ios':
						byPushType.push(new AfpAPNS(configByPushType));
						break;
					case 'android':
						byPushType.push(new AfpGCM(configByPushType));
						break;
				}

				console.log("end");
			}
		}
	}
}

/**
 * Get an array of valid push types.
 * @returns {Array} An array of valid push types
 */
AfpParsePushAdapter.prototype.getValidPushTypes = function () {
	return this.validPushTypes;
}

AfpParsePushAdapter.prototype.send = function (data, installations) {
	let deviceMap = classifyInstallation(installations, this.validPushTypes);

	let sendPromises = [];

	for (let pushType in deviceMap) {
		let appIdentifier = pushType["appIdentifier"];
		let appIdentifierSender = this.senderMapByAppId[appIdentifier];

		if (!appIdentifierSender) {
			console.log('Can not find appIdentifier sender for appId %s, %j', appIdentifierSender, data);
			continue;
		}

		// Should be AfpAPNS or AfpGCM
		let sender = appIdentifierSender[pushType];

		if (!sender) {
			console.log('Can not find sender for push type %s, %j', pushType, data);
			continue;
		}

		let devices = deviceMap[pushType];

		sendPromises.push(sender.send(data, devices));
	}

	return Parse.Promise.when(sendPromises);
}

/**g
 * Classify the device token of installations based on its device type.
 * @param {Object} installations An array of installations
 * @param {Array} validPushTypes An array of valid push types(string)
 * @returns {Object} A map whose key is device type and value is an array of device
 */
function classifyInstallation(installations, validPushTypes) {
	// Init deviceTokenMap, create a empty array for each valid pushType
	let deviceMap = {};

	for (let validPushType of validPushTypes) {
		deviceMap[validPushType] = [];
	}

	for (let installation of installations) {
		// No deviceToken or appId or deviceType, ignore
		if (!installation.deviceToken || !installation.appIdentifier || !installation.deviceType) {
			continue;
		}

		// Check if the sender exists
		if (!this.senderMapByAppId[installation.appIdentifier])
		{
			let pushType = installation.deviceType;

			if (deviceMap[pushType]) {
				deviceMap[pushType].push({
					deviceType: installation.deviceType,
					deviceToken: installation.deviceToken,
					appIdentifier: installation.appIdentifier
				});
			} else {
				console.log('Unknown push type from installation %j', installation);
			}
		}
	}

	return deviceMap;
}

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
	AfpParsePushAdapter.classifyInstallation = classifyInstallation;
}
module.exports = AfpParsePushAdapter;
