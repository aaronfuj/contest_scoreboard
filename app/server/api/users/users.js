'use strict';

var express = require('express');
var User = require('../../../models/user');

var Permissions = require('../../../server/permissions.js');

var router = express.Router();

router.get('/', Permissions.isAdmin, getAllUsers);
router.post('/', Permissions.isAdmin, createUser);
router.put('/:id', Permissions.isAdmin, updateUserJson);
router.post('/:id', Permissions.isAdmin, updateUserRedirect);

function getAllUsers(req, res) {
  User.find()
    .exec(function (err, users) {
      if (err) {
        console.log(err);
        return res.status(400).send(err);
      }
      else {
        return res.json(users);
      }
    });
}

function updateUserJson(req, res) {
  return updateUser(req, res, true);
}

function updateUserRedirect(req, res) {
  return updateUser(req, res, false);
}

function updateUser(req, res, returnJson) {
  var userId = req.params.id;

  // Instantiate a new user just to be able to generate hashes
  var newUser = new User();

  var updateUser = {
  };
  console.log(req.body);
  updateUser["local.username"] = req.body.username;
  updateUser["local.password"] = newUser.generateHash(req.body.password);

  User.findByIdAndUpdate(userId, {$set: updateUser}, {'new': true}).lean()
    .exec(function(err, user) {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      else {
        if(returnJson) {
          return res.json(user);
        }
        else {
          return res.redirect('/modify/' + userId);
        }
      }
    }
  )
}

function createUser(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // find a user whose username is the same as the forms username
  // we are checking to see if the user trying to login already exists
  User.findOne({ 'local.username' :  username }, function(err, user) {
    // if there are any errors, return the error
    if (err)
      return res.status(400).send(err);

    // check to see if theres already a user with that username
    if (user) {
      return res.status(400).send('Username already taken');
    } else {

      // if there is no user with that username
      // create the user
      var newUser            = new User();

      // set the user's local credentials
      newUser.local.username = username;
      newUser.local.password = newUser.generateHash(password);

      if(req.body && req.body.role) {
        newUser.local.role = req.body.role;
      }

      // save the user
      newUser.save(function(err) {
        if (err) {
          return res.status(400).send(err);
        }
        else {
          return res.redirect('/signup');
        }
      });
    }

  });
}

module.exports = router;
