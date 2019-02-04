var util = require('util');
var express = require('express');
var app = express();
var passport = require("passport");
var paypal = require('paypal-rest-sdk');
var bodyParser = require('body-parser');

var fs = require('fs');
var request = require('request');
var dao = require('./dao.js');
var account_routes = require('./routes/account.js');
var team_routes = require('./routes/team.js');
var payment_routes = require('./routes/payment.js');
var stats_routes = require('./routes/stats.js');
const bcrypt= require('bcrypt')
const uuidv4 = require('uuid/v4');
//TODO LIST:
//Add forgot password functionality
//Add email confirmation functionality
var teamPrice;

app.use(bodyParser.json());
app.use(express.static('public'));

const LocalStrategy = require('passport-local').Strategy;
  
module.exports = function (app) {

	app.get('/', function (req, res, next) {
		res.render('index', {title: "Home", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});

	account_routes(app);
	team_routes(app);
	payment_routes(app);
	stats_routes(app);
}