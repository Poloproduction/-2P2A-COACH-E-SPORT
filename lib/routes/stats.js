var util = require('util');
var express = require('express');
var app = express();
var passport = require("passport");
var paypal = require('paypal-rest-sdk');
var bodyParser = require('body-parser');

var fs = require('fs');
var request = require('request');
var dao = require('../dao.js');
const bcrypt= require('bcrypt')
const uuidv4 = require('uuid/v4');

var teamPrice;

app.use(bodyParser.json());
app.use(express.static('public'));

const LocalStrategy = require('passport-local').Strategy;

var stats_routes = function(app) {

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
}

module.exports = stats_routes;