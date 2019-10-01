/**
 * Created by aaronfujimoto on 7/19/16.
 */

var JUDGE_STRING = 'judge';
var ADMIN_STRING = 'admin';

var JUDGE_VALUE = 1;
var ADMIN_VALUE = 2;

var ROLE_VALUE_MAP = {
    judge: JUDGE_VALUE,
    admin: ADMIN_VALUE
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();
    else
        console.log('Not logged in', req);
        return res.status(400).send("Not logged in");
}

function getRoleValue(user) {
    console.log(user);
    if(user) {
        return ROLE_VALUE_MAP[user.local.role] || 0;
    }
    else {
        return 0;
    }
}


function isAtLeastJudge(req, res, next) {
    if (req.isAuthenticated() && getRoleValue(req.user) >= JUDGE_VALUE) {
        return next();
    }
    else {
        return res.status(400).send("Not at least a judge");
    }
}

function isAdmin(req, res, next) {
    if (req.isAuthenticated() && getRoleValue(req.user) === ADMIN_VALUE) {
        return next();
    }
    else {
        return res.status(400).send("Not an admin");
    }
}

module.exports = {
    JUDGE_STRING: JUDGE_STRING,
    ADMIN_STRING: ADMIN_STRING,
    JUDGE_VALUE: JUDGE_VALUE,
    ADMIN_VALUE: ADMIN_VALUE,

    isLoggedIn: isLoggedIn,
    isAtLeastJudge: isAtLeastJudge,
    isAdmin: isAdmin
};