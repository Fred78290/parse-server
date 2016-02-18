// Example express application adding the parse-server module to expose Parse
// compatible API routes.
//require('babel-register');
var express = require('express');
var ParseServer = require("./lib/index").ParseServer;
var AfpPushAdapter = require("./lib/afp/Push/AfpParsePushAdapter");

var databaseUri = process.env.DATABASE_URI || process.env.MONGOLAB_URI

if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}

var pushConfig = {
	// bundleID
	"com.afp.afppro": {
		android: {
			senderId: '420333730945', // The Sender ID of GCM
			apiKey: 'AIzaSyDCwzClSKGqIwq4etaD9yihoAm9BkrMdwo' // The Server API Key of GCM
		},
		ios: [
			{
				pfx: __dirname + '/apns/afppro_apns_dev.p12', // The filename of private key and certificate in PFX or PKCS12 format from disk
				production: false // Specifies which environment to connect to: Production (if true) or Sandbox
			},
			{
				pfx: __dirname + '/apns/afppro_apns_prod.p12', // The filename of private key and certificate in PFX or PKCS12 format from disk
				production: true // Specifies which environment to connect to: Production (if true) or Sandbox
			}
		]
	}
}

var options = {
	databaseURI: databaseUri || 'mongodb://localhost:27017/parse',
	cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/src/cloud/main.js',
	appId: process.env.APP_ID || '8WhUyGdyBn5xhOip3BXpILNpB3fGeT2StEqB6L5m',
	masterKey: process.env.MASTER_KEY || '4fcfbr8PPg6hJpZQ8lQjyeNu5tHMRA8SIQ1RDPxH',
	push: {
		adapter: new AfpPushAdapter(pushConfig)
	}
}

var api = new ParseServer(options);
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

// Serve the Parse API on the /parse URL prefix
var mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a web site.');
});

var port = process.env.PORT || 8082;
app.listen(port, function() {
    console.log('parse-server-example running on port ' + port + '.');
});
