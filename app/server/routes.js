var Permissions = require('./permissions.js');
var User = require('../models/user.js');

module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
      if(req.isAuthenticated()) {
        res.redirect('/app');
      }
      else {
        res.redirect('/live');
      }
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {
      if(req.isAuthenticated()) {
        res.redirect('/app');
      }
      else {
        // render the page and pass in any flash data if it exists
        res.render('login.ejs', {message: req.flash('loginMessage')});
      }
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/app/', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', Permissions.isAdmin, function(req, res) {

      User.find()
        .lean()
        .exec(function (err, users) {
          if (err) {
            console.log(err);
            return res.status(400).send(err);
          }
          else {
            if(!users) {
              users = [];
            }
            console.log(users);
            // render the page and pass in any flash data if it exists
            return res.render('signup.ejs',
              {
                username: req.user.local.username,
                users: users,
                message: req.flash('signupMessage')
              });
          }
        });
    });

    // process the signup form
    app.post('/signup', Permissions.isAdmin, passport.authenticate('local-signup', {
        successRedirect : '/signup', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

    app.get('/modify/:id', Permissions.isAdmin, function(req, res) {
      var userId = req.params.id;
      User.findById(userId)
        .lean()
        .exec(function (err, user) {
          if (err) {
            console.log(err);
            return res.status(400).send(err);
          }
          else {
            if(!user) {
              user = {};
            }
            console.log(user);
            // render the page and pass in any flash data if it exists
            return res.render('modify.ejs',
              {
                user: user
              });
          }
        });
    });

    app.get('/loggedin', function(req, res) {
      if(req.isAuthenticated()) {
        res.send(req.user)
      }
      else {
        res.status(400);
      }
    });

    app.get('/api/user', function(req, res) {
      if(req.isAuthenticated()) {
        res.send(req.user)
      }
      else {
        res.status(400);
      }
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/login');
    });

    //
    app.get('/app', isLoggedIn, function(req, res) {
      if(req.isAuthenticated()) {
        res.render('angular_template.ejs', {});
      }
      else {
        res.redirect('/login');
      }
    });

    app.get('/live', function(req, res) {
      res.render('angular_live_template.ejs', {});
    });

    // =========================================================================
    // API =====================================================================
    // =========================================================================

    //app.use('/api', isLoggedIn);
    app.use('/api/users', require('./api/users/users'));

    app.use('/api/activeheats', require('./api/active/heats'));
    app.use('/api/scores', require('./api/scores/scores'));
    app.use('/api/divisions', require('./api/divisions/divisions'));
    app.use('/api/rounds', require('./api/rounds/rounds'));
    app.use('/api/heats', require('./api/heats/heats'));
    app.use('/api/riders', require('./api/riders/riders'));
    app.use('/api/settings', require('./api/settings/settings'));
    app.use('/api/contestorder', require('./api/contestOrder/contestOrder'));

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
