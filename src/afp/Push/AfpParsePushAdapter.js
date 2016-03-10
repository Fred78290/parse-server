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
		// Get push config for current bundleId
		let config = pushConfig[bundleId];

		// Check for each valid pushType
		for (let pushType of Object.keys(config)) {
			if (this.validPushTypes.indexOf(pushType) < 0) {
				console.log('Push to ' + pushTypes + ' is not supported');

				throw new Parse.Error(Parse.Error.PUSH_MISCONFIGURED, 'Push to ' + pushTypes + ' is not supported');
			}
			else {
				let configByPushType = config[pushType];
				let byBundleID = this.senderMapByAppId[bundleId];

				// Reinject bundleId
				if (Array.isArray(configByPushType))
					for (var i = 0; i < configByPushType.length; i++)
						configByPushType[i]["bundleId"] = bundleId;
				else
					configByPushType["bundleId"] = bundleId;

				if (!byBundleID)
					byBundleID = this.senderMapByAppId[bundleId] = {};

				let byPushType = byBundleID[pushType];

				if (!byPushType)
					byPushType = byBundleID[pushType] = [];

				switch (pushType) {
					case 'ios':
						byPushType.push(new AfpAPNS(configByPushType));
						break;
					case 'android':
						byPushType.push(new AfpGCM(configByPushType));
						break;
				}
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
	let appIdentifier = data.appIdentifier;
	let deviceMap = this.classifyInstallation(appIdentifier, installations);
	let appIdentifierSender = this.senderMapByAppId[appIdentifier];
	let sendPromises = [];

	if (!appIdentifierSender) {
		console.log('Can not find appIdentifier sender for appId %s, %j', appIdentifier, data);
	}
	else {
		for (let pushType in deviceMap) {
			let devices = deviceMap[pushType];

			// Should be an array of AfpAPNS or AfpGCM
			let senders = appIdentifierSender[pushType];

			if (!senders) {
				console.log('Can not find sender for push type %s, %j', pushType, data);
				continue;
			}

			if (Array.isArray(senders)) {
				for (var index = 0; index < senders.length; index++) {
					let sender = senders[index];

					sendPromises.push(sender.send(data, devices));
				}
			} else {
				sendPromises.push(senders.send(data, devices));
			}
		}
	}

	console.log('Send push to: %j for:%j', sendPromises, data);

	return Parse.Promise.when(sendPromises);
}

/**g
 * Classify the device token of installations based on its device type.
 * @param {Object} installations An array of installations
 * @param {Array} validPushTypes An array of valid push types(string)
 * @returns {Object} A map whose key is device type and value is an array of device
 */
AfpParsePushAdapter.prototype.classifyInstallation = function classifyInstallation(appIdentifier, installations) {
	// Init deviceTokenMap, create a empty array for each valid pushType
	let deviceMap = {};

	// Check if configured for this appIdentifier
	if (!this.senderMapByAppId[appIdentifier]) {
		return deviceMap;
	}

	for (let pushType of this.validPushTypes) {
		deviceMap[pushType] = [];
	}

	for (let installation of installations) {
		// No deviceToken or appId or deviceType, ignore
		if (!installation.deviceToken || !installation.appIdentifier || !installation.deviceType) {
			continue;
		}

		// Check if the good appIdentifier
		if (installation.appIdentifier != appIdentifier) {
			continue;
		}

		// Check if the sender exists
		let pushType = installation.deviceType;

		if (deviceMap[pushType]) {
			deviceMap[pushType].push({
				deviceType: installation.deviceType,
				deviceToken: installation.deviceToken,
				appIdentifier: installation.appIdentifier,
				production:!installation.sandbox ? true : installation.sandbox == false
			});
		} else {
			console.log('Unknown push type from installation %j', installation);
		}
	}

	return deviceMap;
}

module.exports = AfpParsePushAdapter;
