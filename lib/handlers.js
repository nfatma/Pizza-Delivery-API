/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');
var querystring = require('querystring');

// Define all the handlers
var handlers = {};

// Users
handlers.users = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data,callback);
  } else {
    callback(405);
  }
};

// Container for all the users methods
handlers._users  = {};

// Users - post
// Required data: firstName, lastName, email, street address, password
// Optional data: none
handlers._users.post = function(data,callback){
  // Check that all required fields are filled out
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
  var streetAdd = typeof(data.payload.streetAdd) == 'string' && data.payload.streetAdd.trim().length > 0 ? data.payload.streetAdd.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var cartItems = [];
  //console.log(firstName+lastName+email+streetAdd+password);
  if(firstName && lastName && email  && streetAdd && password){
    // Make sure the user doesnt already exist
    _data.read('users',email,function(err,data){
      if(err){
        // Hash the password
        var hashedPassword = helpers.hash(password);

        // Create the user object
        if(hashedPassword){
          var userObject = {
            'firstName' : firstName,
            'lastName' : lastName,
            'email' : email,
            'streetAdd' : streetAdd,
            'hashedPassword' : hashedPassword,
            'cartItems' : cartItems
          };

          // Store the user
          _data.create('users',email,userObject,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not create the new user'});
            }
          });
        } else {
          callback(500,{'Error' : 'Could not hash the user\'s password.'});
        }

      } else {
        // User alread exists
        callback(400,{'Error' : 'A user with that email address already exists'});
      }
    });

  } else {
    callback(400,{'Error' : 'Missing required fields'});
  }

};

// Required data: email
// Optional data: none
handlers._users.get = function(data,callback){
  // Check that  email is valid
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
  if(email){

    //Get the token from the header
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Verify that the given token is valid for the email address
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
      _data.read('users',email,function(err,data){
      if(!err && data){
        // Remove the hashed password from the user user object before returning it to the requester
        delete data.hashedPassword;
        callback(200,data);
      } else {
        callback(404);
      }
    });

      } else{
        callback(403,{'Error' : 'Missing required token in header or token id invalid'});
      }
    });
    
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

// Required data: email
// Optional data: firstName, lastName, password (at least one must be specified)
handlers._users.put = function(data,callback){
  // Check for required field
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0? data.payload.email.trim() : false;

  // Check for optional fields
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;    var streetAdd = typeof(data.payload.streetAdd) == 'string' && data.payload.streetAdd.trim().length > 0 ? data.payload.streetAdd.trim() : false;
  var streetAdd = typeof(data.payload.streetAdd) == 'string' && data.payload.streetAdd.trim().length > 0 ? data.payload.streetAdd.trim() : false;


  // Error if email is invalid
  if(email){
    // Error if nothing is sent to update
    if(firstName || lastName || password ||streetAdd){

       //Get the token from the header
       var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      
        //Verify that the given token is valud for the email address
      handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){

        // Lookup the user
      _data.read('users',email,function(err,userData){
        if(!err && userData){
          // Update the fields if necessary
          if(firstName){
            userData.firstName = firstName;
          }
          if(lastName){
            userData.lastName = lastName;
          }
          if(password){
            userData.hashedPassword = helpers.hash(password);
          }
          if(lastName){
            userData.streetAdd = streetAdd;
          }
          // Store the new updates
          _data.update('users',email,userData,function(err){
            if(!err){
              callback(200);
            } else {
              console.log(err);
              callback(500,{'Error' : 'Could not update the user.'});
            }
          });
        } else {
          callback(400,{'Error' : 'Specified user does not exist.'});
        }
      });

      } else {
        callback(403,{'Error' : 'Missing required token in thr header, or token is invalid'});
      }
    });
      
    } else {
      callback(400,{'Error' : 'Missing fields to update.'});
    }
  } else {
    callback(400,{'Error' : 'Missing required field.'});
  }
};

// Required data: email 

handlers._users.delete = function(data,callback){
  // Check that email  address is valid
  var email = typeof(data.queryStringObject.email ) == 'string' && data.queryStringObject.email .trim().length > 0 ? data.queryStringObject.email .trim() : false;
  if(email ){

    //Get the token from the header
       var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      
        //Verify that the given token is valud for the email  address
      handlers._tokens.verifyToken(token,email ,function(tokenIsValid){
      if(tokenIsValid){
        // Lookup the user
     _data.read('users',email ,function(err,userData){
      if(!err && userData){
        _data.delete('users',email ,function(err){
          if(!err){
            callback(200,'User deleted');
          } else {
            callback(500,{'Error' : 'Could not delete the specified user'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }
    });
      } else{
        callback(403,{'Error' : 'Missing required token in thr header, or token is invalid'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


// Tokens
handlers.tokens = function(data,callback){
  var acceptableMethods = ['post','get','put','delete'];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data,callback);
  } else {
    callback(405);
  }
};

//Container for all the tokens methods'
handlers._tokens = {};

//Tokens - post
// required data : email , password
//Optional data : none
handlers._tokens.post = function(data,callback){
  var email  = typeof(data.payload.email ) == 'string' && data.payload.email .trim().length > 0? data.payload.email .trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if(email  && password){
    //Lookup for user who matches the email  number
    _data.read('users',email ,function(err,userData){
      if(!err && userData){
      // Hash the sent password and compare it to the password stored in user object
      var hashedPassword = helpers.hash(password);
      if(hashedPassword == userData.hashedPassword){
        //if valid create a new token with a random name. set expiration date on ehour in future
        var tokenId = helpers.createRandomString(20);

        var expires = Date.now() + 1000*60*60;
        var tokenObject = {
          'email' : email,
          'id' : tokenId,
          'expires' : expires
        };

        //Store the token
        _data.create('tokens',tokenId,tokenObject,function(err){
          if(!err){
            callback(200,tokenObject);
          } else{
            callback(500,{'Error' : 'Could not create the new token'});
          }
        });
      
      } else{
        callback(400,{'Error' : 'Could not find the specifed user'});
      }
      } else{
  callback(400,{'Error' : 'couldnot find the specifed user'});
      }
    });
  } else{
    callback(400,{'Error': 'Missing required field(s)'});
  }

};


//Tokens - get
handlers._tokens.get = function(data,callback){
  //Check id of the user is valid or not
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the user
    _data.read('tokens',id,function(err,tokenData){
      if(!err && data){
        // Remove the hashed password from the user user object before returning it to the requester
        delete data.hashedPassword;
        callback(200,tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};

//Tokens - put
//Requied data : id, extend
// optional data : none
handlers._tokens.put = function(data,callback){
    var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
    var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true  ? true : false;
    if(id && extend){
      //Look up the token
      _data.read('tokens',id,function(err,tokenData){
        if(!err && tokenData){
          //Checks to make sure the token isn't already expired
          if(tokenData.expires > Date.now()){
            // Set the expression an hour from now
            tokenData.expires = Date.now() + 1000 * 3600;

            //Store the new updates
            _data.update('tokens',id,tokenData,function(err){
              if(!err){
                callback(200);
              } else {
                callback(500,{'Error' : 'Could not update the token\'s expiration'});
              }
            });
          } else {
            callback(400,{'Error' : 'the token has already expired'});
          }
        } else{
          callback(400,{'Error' : 'Specified token does not exist'});
        }
      });
    } else{
      callback(400,{'Error' : 'Missing required fields'});
    }
};

//Tokens - delete
//Required data : id
//Optional data : none
handlers._tokens.delete = function(data,callback){
   // Check that email address is valid
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if(id){
    // Lookup the token
    _data.read('tokens',id,function(err,data){
      if(!err && data){
        _data.delete('tokens',id,function(err){
          if(!err){
            callback(200);
          } else {
            callback(500,{'Error' : 'Could not delete the specified token'});
          }
        });
      } else {
        callback(400,{'Error' : 'Could not find the specified user.'});
      }
    });
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }

};

//Verify if the given id is currenty valid for given user
handlers._tokens.verifyToken = function(id,email,callback){
  //Look up the token
  _data.read('tokens',id,function(err,tokenData){
    if(!err && tokenData){
      //Check that the token is for the given user and not expire
      if(tokenData.email == email && tokenData.expires > Date.now()){
        callback(true);
      } else {
        callback(false);
      }

    } else {
      callback(false);
    }
  });
};

// Menu
handlers.menu ={};

handlers.menu = function(data,callback){
  if(data.method == 'get'){
    handlers.menu.get(data,callback);
  } else {
    callback(405);
  }
};

// Required data: email
// Optional data: none
handlers.menu.get = function(data,callback){
  // Check that  email is valid
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
  if(email){

    //Get the token and menu from the header
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Verify that the given token is valid for the email address
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
      if(tokenIsValid){
          // Lookup the user
         _data.read('menu','menu',function(err,data){
            if(!err && data){
              callback(200,data);
          } else {
              callback(404,err);
      }
    });


      } else{
        callback(403,{'Error' : 'Missing required token in header or token id invalid'});
      }
    });
    
  } else {
    callback(400,{'Error' : 'Missing required field'})
  }
};


// Cart
handlers.cart ={};

handlers.cart = function(data,callback){
  var acceptableMethods = ['post','put',];
  if(acceptableMethods.indexOf(data.method) > -1){
    handlers.cart[data.method](data,callback);
  } else {
    callback(405);
  }
};

handlers.cart.post = function(data,callback){

  var listOfItems = typeof(data.payload.listOfItems) == 'object' && data.payload.listOfItems instanceof Array ? data.payload.listOfItems:[];
  if(listOfItems){
    // Check that  email is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
    if(email){

      //Get the token and menu from the header
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      //Verify that the given token is valid for the email address
      handlers._tokens.verifyToken(token,email,function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users',email,function(err,userData){
            if(!err && userData){
              // fill the cart
              console.log(userData.cartItems,listOfItems);
              userData.cartItems = userData.cartItems.concat(listOfItems);
              // Store the new updates
              _data.update('users',email,userData,function(err){
                if(!err){
                  callback(200);
                } else {
                   console.log(err);
                   callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            }
          });
          
        } else{
         callback(403,{'Error' : 'Missing required token in header or token id invalid'});
        }
      });
    
    } else {
      callback(400,{'Error' : 'Missing required field'});
    }
  }  else {
     callback(500,{'Error' : 'Your cart is empty'});
  }
};

handlers.cart.put = function(data,callback){
 var listOfItems = typeof(data.payload.listOfItems) == 'object' && data.payload.listOfItems instanceof Array ? data.payload.listOfItems:[];
  if(listOfItems){
    // Check that  email is valid
    var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
    if(email){

      //Get the token and menu from the header
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      //Verify that the given token is valid for the email address
      handlers._tokens.verifyToken(token,email,function(tokenIsValid){
        if(tokenIsValid){
          // Lookup the user
          _data.read('users',email,function(err,userData){
            if(!err && userData){
              // Update the cart if necessary
              userData.cartItems.splice(0, userData.cartItems.length, ...listOfItems);
              // Store the new updates
              _data.update('users',email,userData,function(err){
                if(!err){
                  callback(200);
                } else {
                   console.log(err);
                   callback(500,{'Error' : 'Could not update the user.'});
                }
              });
            }
          });
          
        } else{
         callback(403,{'Error' : 'Missing required token in header or token id invalid'});
        }
      });
    
    } else {
      callback(400,{'Error' : 'Missing required field'});
    }
  }  else {
     callback(500,{'Error' : 'Your cart is empty'});
  }
};

// Orders
var orders = {};

handlers.orders = function(data,callback){
  if(data.method === 'post'){
    handlers.orders.post(data,callback);
  } else {
    callback(405);
  }
};


//oders - POST
handlers.orders.post = function(data,callback){
  //Validate the email in the query string
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 5 ? data.queryStringObject.email.trim() : false;
  if (email){
    //Vlidate the token
     var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    //Verify that the given token is valid for the email address
    handlers._tokens.verifyToken(token,email,function(tokenIsValid){
        if(tokenIsValid){
          // read the users info
          _data.read('users',email,function(err,userData){
            if(!err && userData){
              //calculate the amount
              var amount = userData.cartItems.length * 100;
              if(amount){
                helpers.proceedPayment(email,amount,callback);
              }else { 
                callback('your cart is empty');
              }
            } else{
              callback(404,{'Error':'User information is missing'});
            }
          });

        } else {
          callback(500,{'Error' : 'token in the header is either invalid or expired'});
        }
    });
 
  } else {
    callback(404,{'Error':'Specified user doesn\'t exist'});
  }
};



// Export the handlers
module.exports = handlers;