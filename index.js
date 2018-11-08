/*
 * NodeJS Master Class
 * Homework assignment #1
 * @author:Niklas Tidén
 */

 // Dependencies
 const http = require('http');
 const https = require('https');
 const url = require('url');
 const StringDecoder = require('string_decoder').StringDecoder;
 const config = require('./config');
 const fs = require('fs');

 // Define handlers
 let handlers = {};

 // Ping handler
 handlers.ping = (data,callback) => {
   callback(200);
 };

 // Hello handler
 handlers.hello = (data,callback) => {
   callback(406,{'name' : 'Hello Mr! I\'m here waiting to serve...'});
 };

 // Respond to not found requests
 handlers.notFound = (data,callback) => {
   callback(404);
 };

 // Define a request router
 const router = {
   'ping' : handlers.ping,
   'hello' : handlers.hello
 }

 // Instantiate the server
 const httpServer = http.createServer((req,res) => {
  commonServer(req,res);
 });

 // Start the server, and have it listen to the choosen port
 httpServer.listen(config.httpPort,() => {
  console.log("The server is listening on port " + config.httpPort);
 });

 const httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cert' : fs.readFileSync('./https/cert.pem')
 };

 // Instatiate the server
 const httpsServer = https.createServer(httpsServerOptions,(req,res) => {
   commonServer(req,res);
 });

 // Start up the server abd have it listen to the choosen port
 httpsServer.listen(config.httpsPort, () => {
   console.log("The server is listening on port " + config.httpsPort);
 });

// All logic in to one function
const commonServer = (req,res) => {

  // Get the URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // Get and trim the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the querystring as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get a decoder
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    // Choose the handler
    let choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    let data = {
      'choosenHandler' : choosenHandler,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : buffer
    };

    // Route the request to the handler specified in the router
    choosenHandler(data,(statusCode,payload) => {
      // Use the status code called back by the handler ...
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      // Use the payload called back by the handler, or default to an empty object
      payload = typeof(payload) == 'object' ? payload : {};
      // Convert the payload
      let payloadString = JSON.stringify(payload);

      // Return the response to clients
      res.setHeader('Content-type','application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log all requests
      console.log('Returning response: ',statusCode,payloadString);

    });
  });
};
