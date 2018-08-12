/*
 * Primary file for API
 *
 */

//Dependencies
var server = require('./lib/server');
//var workers = require('./lib/workers');

//Create a container for pizza
var pizza = {};

//
pizza.init = function(){
  // Start the server
  server.init();

  // Start the workers
  //workers.init(); 

};


// Execute
pizza.init();

// Export the pizza
module.exports = pizza;