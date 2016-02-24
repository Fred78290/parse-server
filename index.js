// Example express application adding the parse-server module to expose Parse
// compatible API routes.
//require('babel-register');
var fs = require("fs");
var express = require('express');
var jsonPushConfig = JSON.parse(fs.readFileSync(__dirname + '/pushConfig.json', "utf8"));
var jsonOptions = JSON.parse(fs.readFileSync(__dirname + '/config.json', "utf8"));
var ParseServer = require("./lib/index").ParseServer;
var AfpPushAdapter = require("./lib/afp/Push/AfpParsePushAdapter");

var options = {
	databaseURI: jsonOptions.databaseUri,
	cloud: jsonOptions.cloud,
	appId: jsonOptions.appId,
	restAPIKey: jsonOptions.restAPIKey,
	masterKey: jsonOptions.masterKey,
	clientKey: jsonOptions.clientKey,
	push: {
		adapter: new AfpPushAdapter(jsonPushConfig)
	}
}

// Serve the Parse API on the /parse URL prefix
var mountPath = jsonOptions.mountPath || '/parse';
var port = jsonOptions.port || 8082;
var api = new ParseServer(options);

// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

var app = express();

app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a web site.');
});

app.listen(port, function() {
    console.log('parse-server running on port ' + port + '.');
});
