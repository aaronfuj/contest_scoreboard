// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var path     = require('path');
var http     = require('http');
var app      = express();
var port     = process.env.PORT || 8080;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

var server   = http.Server(app);
var io       = require('socket.io')(server);

var sessionSecret = require('./config/sessionSecret').secret;

// configuration ===============================================================
mongoose.connect(process.env.MONGODB_URI || configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('view engine', 'ejs'); // set up ejs for templating

app.use(express.static(path.join(__dirname, 'public'))); // setup the public path to be used
app.use(express.static('app/client'));
app.use(express.static('build'));
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));
app.use('/font-awesome-4.5.0', express.static(path.join(__dirname, '/font-awesome-4.5.0')));

// required for passport
app.use(session({ secret: sessionSecret })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/server/routes.js')(app, passport); // load our routes and pass in our app and fully configured passport

// socket ======================================================================
require('./app/server/socket.js').initialize(io);

// launch ======================================================================

server.listen(port);
console.log('Server started on port ' + port);
