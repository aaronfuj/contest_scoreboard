// seedusers.js

// Update the array of users to contain any users that should be created and stored in the database.
// Then run the npm script to import the users
//
//    npm run seedusers
//
// This should then populate the database with the users below and can be a starting point for the contest.

// Available roles:
// - admin
// - judge

module.exports = {
  "users" : [
    {
      "username" : "admin",
      "password" : "password",
      "role" : "admin"
    }
  ]
};