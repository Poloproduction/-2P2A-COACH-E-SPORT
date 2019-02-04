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
const bcrypt= require('bcrypt')
const uuidv4 = require('uuid/v4');
//TODO LIST:
//Add forgot password functionality
//Add email confirmation functionality
var teamPrice;

app.use(bodyParser.json());
app.use(express.static('public'));

const LocalStrategy = require('passport-local').Strategy;

paypal.configure({
	'mode': 'sandbox', //sandbox or live
	'client_id': 'AbpJOtx6UN5_SwTjiAUJozSFI6sl2cApniEelAtVbf7_k68wot5sTw55P5bEnyJezcrFT6rMq-X7xvYP',
	'client_secret': 'ELxNsSvOwk1BZ6MzK3Ngo-UPylK4nWC24KTpH9zS-FGTco59vaWVZl4GJiTnBeV4Bap0d-gyFT-gMfE7'
});
  
module.exports = function (app) {

	app.get('/', function (req, res, next) {
		res.render('index', {title: "Home", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});

	account_routes(app);
	team_routes(app);
	payment_routes(app);

	/* STATS */
	app.get('/stats', function(req, res){
		res.render('stats', {title: "Stats", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});


	var uri = 'https://api.fortnitetracker.com/v1/profile/';
	// https://api.fortnitetracker.com/v1/profile/{platform}/{epic-nickname}
	// pc, xbl, psn
	// TRN-Api-Key: 1c596770-fc6b-44f7-9017-dfcf36316311
	app.post('/stats', function(req, res){
		request.get(uri + req.body.dropDownValue + '/' + req.body.epicNickName, {
			headers : {
				'TRN-Api-Key': '1c596770-fc6b-44f7-9017-dfcf36316311'
			}}, function(error, response, body) {
				res.json(body);
			});
	});
	/* END STATS */
}