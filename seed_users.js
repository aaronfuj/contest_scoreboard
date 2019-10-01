// seed_users.js

// set up ======================================================================
// get all the tools we need
var _ = require('lodash');
var mongoose = require('mongoose');
var configDB = require('./config/database.js');

// connect to the database ===============================================================
mongoose.connect(process.env.MONGODB_URI || configDB.url); // connect to our database

// load up the user model
var User = require('./app/models/user');

/**
 * Creates a new user asynchronously
 * @param username the name of the user
 * @param password the password for the user
 * @param role the role, can be admin or judge
 */
function createUser(username, password, role) {
  console.log("Creating user " + username + " with password " + password + " and role " + role);

  // if there is no user with that username
  // create the user
  var newUser = new User();

  // set the user's local credentials
  newUser.local.username = username;
  newUser.local.password = newUser.generateHash(password);
  newUser.local.role = role;

  // save the user
  newUser.save(function(err) {
    if (err)
      throw err;
    return newUser;
  });
}

// Grab all the config users
var usersToSeed = require('./config/seedusers').users;

// Seed each of the users
_.forEach(usersToSeed, function(user) {
  createUser(user.username, user.password, user.role);
});

// Log the completion
console.log('Seeded the database, you may need to manually kill this process now');
