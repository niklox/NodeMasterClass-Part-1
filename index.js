/*
 *
 * Primary file for https
 *
 */

 // Dependencies
 const http = require('http');
 const https = require('https');
 const url = require('url');
 const StringDecoder = require('string_decoder').StringDecoder;
 const config = require('./config');
 const fs = require('fs');

 // Instatiate the server
const httpServer = http.createServer(function(req,res){
  commonServer(req,res);
});

// Start the server, and have it listen to port 3000
httpServer.listen(config.httpPort,()=>{
  console.log("The server is listening on port " + config.httpPort);
});

var httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')

};

 // Instatiate the server
 const httpsServer = https.createServer(httpsServerOptions,(req,res)=>{
   commonServer(req,res);
 });

 // Start the server, and have it listen to port 3000
 httpsServer.listen(config.httpsPort,function(){
   console.log("The server is listening on port " + config.httpsPort);
 });

// All logic in to one function
const commonServer = (req,res)=>{

  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the querystring as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload, if any
  const decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  });

  req.on('end', function(){
    buffer += decoder.end();

    // Choose the handler this request should go to
    var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
      'choosenHandler' : choosenHandler,
      'queryStringObject' : queryStringObject,
      'meethod' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // Route the request to the handler specified in the router
    choosenHandler(data,function(statusCode,payload){
      // Use the status code called back by the handler ...
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};
      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-type','application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log the request
      console.log('Returning the response: ',statusCode,payloadString);

    });
  });


};

// Define handlers
var handlers = {};

// Sample handler
handlers.sample = function(data,callback){
  // callback a http status code and a payload
  callback(406,{'name' : 'sample handler'});
};

// Hello handler
handlers.hello = function(data,callback){
  // callback a http status code and a payload
  callback(406,{'name' : 'hello there!'});
};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};

// Define a request router
var router = {
  'sample' : handlers.sample,
  'hello' : handlers.hello
}
