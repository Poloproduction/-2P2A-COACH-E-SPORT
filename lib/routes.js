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
	
	app.get('/pay-success', async function(req, res){
		
		const payerId = req.query.PayerID;
		const paymentId = req.query.paymentId;
	  
		const execute_payment_json = {
		  "payer_id": payerId,
		  "transactions": [{
			  "amount": { 
				  "currency": "USD",
				  "total": teamPrice
			  }
		  }]
		};

		paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
			if(error) {
				console.log(error.response);
				req.flash('warning', 'Error, please try again or contact support');
				res.redirect('/account');
			} else {
				await JSON.stringify(dao.getTeamId(payment.transactions[0].custom, function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						res.redirect('/account');
					}
					else{
						dao.getUser(req.user[0].email, function(err, result) {
							if(!result.rows[0]){
								req.flash('danger', "User account not found");
								res.redirect('/login');
							}
							else{
								req.user[0].id = result.rows[0].id;
							}
						});
						dao.getTeamUser(req.user[0].id, function(err, result) {
							if(result.rows[0]){
								req.flash('danger', "You are already in a team");
								res.redirect('/account');
							}
							else{
								var team_id = uuidv4();
								dao.createTeam(team_id, req.user[0].id, payment.transactions[0].custom, payment.transactions[0].description, function(err, result) {
									req.user[0].team.id = team_id;
									req.user[0].team.coach_id = req.user[0].id;
									req.user[0].team.name = payment.transactions[0].custom;
									req.user[0].team.offer = payment.transactions[0].description;

									req.flash('success', "Team created!")
									
									res.redirect('/account');
									return;
								});
							}
						});
					}
				}));
			}
		});
	});

	app.post('/pay' , ( req , res ) => {

		if(req.body.offer == 1) {
			teamPrice = "35";
		}
		else if(req.body.offer == 2) {
			teamPrice = "100";
		}
		else {
			teamPrice = "350";
		}
		
		const create_payment_json = {
			"intent": "sale",
			"payer": {
				"payment_method": "paypal"
			},
			"redirect_urls": {
				"return_url": "http://" + req.headers.host + "/pay-success",
				"cancel_url": "http://" + req.headers.host + "/account"
			},
			"transactions": [{
				"item_list": {
					"items": [{
						"name": "Fortnite Team",
						"sku": "001",
						"price": teamPrice,
						"currency": "USD",
						"quantity": 1,
					}]
				},
				"amount": {
					"currency": "USD",
					"total": teamPrice
				},
				"description": req.body.offer,
				"custom": req.body.name
			}]
		};

		const team = {
			"name": req.body.name,
			"offer": req.body.offer
		};
		
		paypal.payment.create(create_payment_json, async function (error, payment) {
			if(error) {
				throw error;
			} else {
				await JSON.stringify(dao.getTeamId(payment.transactions[0].custom, function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						res.redirect('/account');
					}
					else{
						dao.getUser(req.user[0].email, function(err, result) {
							if(!result.rows[0]){
								req.flash('danger', "User account not found");
								res.redirect('/login');
							}
							else{
								req.user[0].id = result.rows[0].id;
								dao.getTeamUser(req.user[0].id, function(err, result) {
									if(result.rows[0]){
										req.flash('danger', "You are already in a team");
										res.redirect('/account');
									}
									else{
										for(let i = 0;i < payment.links.length;i++){
											if(payment.links[i].rel === 'approval_url'){
												res.redirect(payment.links[i].href);
											}
										}
									}
								});
							}
						});
					}
				}));
			}
		});
		
	});
}

function generateCode() {
	var code = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	for (var i = 0; i < 5; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return code;
}