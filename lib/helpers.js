/*
 
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require('./config');
var crypto = require('crypto');
var https = require('https');
var querystring = require('querystring');
var path = require('path');
var fs = require('fs');

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str){
  try{
    var obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function(str){
  if(typeof(str) == 'string' && str.length > 0){
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    var str = '';
    for(i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str+=randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Do payment via Stripe API
helpers.proceedPayment = function(email,amount,callback){
  // load from config file
  const currency = config.stripe.currency; 

  // For testing payment, using a testing data token provided by Stripe
  const source = config.stripe.source;
  const payload = querystring.stringify({
    amount,
    currency,
    source,
    description: 'charging for the car items'
  });

  const requestDetails = {
    protocol: "https:",
    method: "POST",
    hostname: "api.stripe.com",
    path: "/v1/charges",
    headers: {
      Authorization: `Bearer ${config.stripe.skey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(payload)
    }
  };
   
    // Instantiate the request object
    var req = https.request(requestDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        // Callback successfully if the request went through
        if(status == 200 || status == 201){
          var msg = 'Payment was succesful, your order will reach soon. Enjoy your meal!';
          helpers.sendEmail(email,msg,callback);
        } else {
          var msg = 'Payment was not succesful, your order isn;t confirmed. Please try again with valid credentials!';
          helpers.sendEmail(email,msg,callback);
        }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      callback(e);
    });

    // Add the payload
    req.write(payload);

    // End the request
    req.end();
};

//send Email via mailGun API
helpers.sendEmail = function(email,msg,callback){
  const payload = querystring.stringify({
        from: config.mailgun.from,
        to : email,
        msg : msg 
      });

  const reqOptions = {
        protocol: "https:",
        method: "POST",
        hostname: "api.mailgun.net",
        path:
          "/v3/sandbox4eb2aa369f714ca3a918e02ae6d34ed2.mailgun.org/messages",
        auth: `api:${config.mailgun.key}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(payload)
        }
  };
  const req = https.request(reqOptions, res => {
        if (res.statusCode === 200) {
          callback(200,'Email sent');
        } else {
          callback(500,{'Error': 'coulnot send email'});
        }
      });
  // Bind to the error event so it doesn't get thrown
  req.on('error',function(e){
      callback(e);
  });

  // Add the payload
  req.write(payload);

  // End the request
  req.end();
};


// Export helpers
module.exports = helpers;