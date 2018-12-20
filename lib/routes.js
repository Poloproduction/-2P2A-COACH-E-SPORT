var util = require('util');
var express = require('express');
var app = express();
var passport = require("passport");
var paypal = require('paypal-rest-sdk');

var fs = require('fs');
var request = require('request');
const { Pool, Client } = require('pg')
const bcrypt= require('bcrypt')
const uuidv4 = require('uuid/v4');
//TODO
//Add forgot password functionality
//Add email confirmation functionality
//Add edit account page


app.use(express.static('public'));

const LocalStrategy = require('passport-local').Strategy;

var currentAccountsData = [];

const databaseUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

const pool = new Pool({
	connectionString: databaseUrl,
});

paypal.configure({
	'mode': 'sandbox', //sandbox or live 
	//TODO: remove client config from github, be careful of travis CI and heroku
	'client_id': 'AbpJOtx6UN5_SwTjiAUJozSFI6sl2cApniEelAtVbf7_k68wot5sTw55P5bEnyJezcrFT6rMq-X7xvYP',
	'client_secret': 'ELxNsSvOwk1BZ6MzK3Ngo-UPylK4nWC24KTpH9zS-FGTco59vaWVZl4GJiTnBeV4Bap0d-gyFT-gMfE7'
});
  

module.exports = function (app) {
	
	app.get('/', function (req, res, next) {
		res.render('index', {title: "Home", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});

	app.get('/member-area', function (req, res, next) {
		res.render('member-area', {title: "Member area", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});

	
	app.get('/join', function (req, res, next) {
		res.render('join', {title: "Join", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});
	
	
	app.post('/join', async function (req, res) {
		
		try{
			const client = await pool.connect()
			await client.query('BEGIN')
			var pwd = await bcrypt.hash(req.body.password, 5);
			await JSON.stringify(client.query('SELECT id FROM "users" WHERE "email"=$1', [req.body.username], function(err, result) {
				if(result.rows[0]){
					req.flash('warning', "This email address is already registered. <a href='/login'>Log in!</a>");
					res.redirect('/');
				}
				else{
					client.query('INSERT INTO users (id, "firstname", "lastname", email, password) VALUES ($1, $2, $3, $4, $5)', [uuidv4(), req.body.firstname, req.body.lastname, req.body.username, pwd], function(err, result) {
						if(err){console.log(err);}
						else {
						client.query('COMMIT')

							req.flash('success','User created.')
							res.redirect('/member-area');
							return;
						}
					});
					
					
				}
				
			}));
			client.release();
		} 
		catch(e){throw(e)}
	});
	
	app.get('/account', function (req, res, next) {
		if(req.isAuthenticated()){
			res.render('account', {title: "Account", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
		else{
			res.redirect('/member-area');
		}
	});
	
	app.get('/login', function (req, res, next) {
		if (req.isAuthenticated()) {
			res.redirect('/account');
		}
		else{
			res.render('login', {title: "Log in", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
		
	});
	
	app.get('/logout', function(req, res){
		
		req.logout();
		req.flash('success', "Logged out. See you soon!");
		res.redirect('/');
	});
	
	app.post('/login',	passport.authenticate('local', {
		successRedirect: '/account',
		failureRedirect: '/member-area',
		failureFlash: true
		}), function(req, res) {
			//TODO: check if remember is in body
		if (req.body.remember) {
			req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
			} else {
			req.session.cookie.expires = false; // Cookie expires at end of session
		}
		res.redirect('/');
	});

	app.get('/create-team', function (req, res, next) {
		if(req.isAuthenticated()){
			res.render('create-team', {title: "Create a team", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
		else{
			res.redirect('/member-area');
		}
	});

	app.post('/update-private-infos', async function(req, res) {
		try{
			if(req.isAuthenticated()){
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "users" WHERE "email"=$1', [req.user[0].email], function(err, result) {
					if(result.rows[0]){
						client.query('UPDATE users SET firstname=$2, lastname=$3, email=$4, birthday=$5 WHERE email=$1', [req.user[0].email, req.body.firstname, req.body.lastname, req.body.email, req.body.birthday.toString()], function(err, result) {
							if(err){console.log(err);}
							else {
							client.query('COMMIT')
								
								req.user[0].firstname = req.body.firstname;
								req.user[0].lastname = req.body.lastname;
								req.user[0].email = req.body.email;
								req.user[0].birthday = req.body.birthday;

								req.flash('success','Private informations updated.');
								res.redirect('/account');
								return;
							}
						});
					}
					else{
						req.flash('danger', "Unknown error n°6870.");
						console.log('Error 6870: email not found');
						res.redirect('/account');
					}
					
				}));
				client.release();
			} 
			else{
				res.redirect('/member-area');
			}	
		}
		catch(e){throw(e)}
	});

	app.post('/update-public-infos', async function(req, res) {
		try{
			if(req.isAuthenticated()){
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "users" WHERE "email"=$1', [req.user[0].email], function(err, result) {
					if(result.rows[0]){
						client.query('UPDATE users SET iam=$2, pseudo=$3, city=$4, weapon=$5 WHERE email=$1', [req.user[0].email, req.body.iam, req.body.pseudo, req.body.city, req.body.weapon], function(err, result) {
							if(err){console.log(err);}
							else {
							client.query('COMMIT')
								
								req.user[0].iam = req.body.iam;
								req.user[0].pseudo = req.body.pseudo;
								req.user[0].city = req.body.city;
								req.user[0].weapon = req.body.weapon;

								req.flash('success','Public informations updated.');
								res.redirect('/account');
								return;
							}
						});
					}
					else{
						req.flash('danger', "Unknown error n°6870.");
						console.log('Error 6870: email not found');
						res.redirect('/account');
					}
					
				}));
				client.release();
			} 
			else{
				res.redirect('/member-area');
			}	
		}
		catch(e){throw(e)}
	});
	
	app.get('/pay-success', async function(req, res){
		
		const payerId = req.query.PayerID;
		const paymentId = req.query.paymentId;
	  
		const execute_payment_json = {
		  "payer_id": payerId,
		  "transactions": [{
			  "amount": {
				  "currency": "USD",
				  //TODO: calculation of price
				  "total": "25.00"
			  }
		  }]
		};

		paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
			if (error) {
				console.log(error.response);
				req.flash('warning', 'Error, please try again or contact support');
				res.redirect('/account');
			} else {
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "team" WHERE "name"=$1', [payment.transactions[0].custom], function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						console.log('Error: team already exists');
						res.redirect('/account');
					}
					else{
						client.query('SELECT * FROM users WHERE email=$1', [req.user[0].email], function(err, result) {
							if(!result.rows[0]){
								req.flash('danger', "User account not found");
								console.log('Error: user account not found');
								res.redirect('/login');
							}
							else{
								req.user[0].id = result.rows[0].id;
							}
						});
						client.query('SELECT * FROM team_users WHERE user_id=$1', [req.user[0].id], function(err, result) {
							if(result.rows[0]){
								req.flash('danger', "You are already in a team");
								console.log('Error: user already in a team');
								res.redirect('/account');
							}
							else{
								var team_id = uuidv4();
								client.query('INSERT INTO team (id, coach_email, name, offer) VALUES ($1, $2, $3, $4)', [team_id, req.user[0].email, payment.transactions[0].custom, payment.transactions[0].description], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
									
										req.user[0].team.id = team_id;
									}
								});
								client.query('INSERT INTO team_users (team_id, user_id) VALUES ($1, $2)', [team_id, req.user[0].id], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')

										req.user[0].team.coach_email = req.user[0].email;
										req.user[0].team.name = payment.transactions[0].custom;
										req.user[0].team.offer = payment.transactions[0].description;

										req.flash('success', "Team created!")
										
										res.redirect('/account');
										return;
									}
								});
							}
						});
					}
				}));
				client.release();
			}
		});
	});

	app.post('/pay' , ( req , res ) => {
		const create_payment_json = {
			"intent": "sale",
			"payer": {
				"payment_method": "paypal"
			},
			"redirect_urls": {
				//TODO: modify to accept heroku / travis CI
				"return_url": "http://localhost:5000/pay-success",
				//TODO: do post pay-cancel road
				"cancel_url": "http://localhost:5000/pay-cancel"
			},
			"transactions": [{
				"item_list": {
					"items": [{
						"name": "Fortnite Team",
						"sku": "001",
						//TODO: calculation of price
						"price": "25.00",
						"currency": "USD",
						"quantity": 1,
					}]
				},
				"amount": {
					"currency": "USD",
					//TODO: calculation of price
					"total": "25.00"
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
			if (error) {
				throw error;
			} else {
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "team" WHERE "name"=$1', [payment.transactions[0].custom], function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						console.log('Error: team already exists');
						res.redirect('/account');
					}
					else{
						client.query('SELECT * FROM users WHERE email=$1', [req.user[0].email], function(err, result) {
							if(!result.rows[0]){
								req.flash('danger', "User account not found");
								console.log('Error: user account not found');
								res.redirect('/login');
							}
							else{
								req.user[0].id = result.rows[0].id;
								client.query('SELECT * FROM team_users WHERE user_id=$1', [req.user[0].id], function(err, result) {
									if(result.rows[0]){
										req.flash('danger', "You are already in a team");
										console.log('Error: user already in a team');
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
				client.release();
			}
		});
		
	});

passport.use('local', new  LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
	
	loginAttempt();
	async function loginAttempt() {
		
		
		const client = await pool.connect()
		try{
			await client.query('BEGIN')
			var currentAccountsData = await JSON.stringify(client.query('SELECT u.id as id, u.firstname as firstname, u.lastname as lastname, u.email as email, u.password as password, u.birthday as birthday, u.iam as iam, u.pseudo as pseudo, u.city as city, u.weapon as weapon, t.id as team_id, t.coach_email as team_coach_email, t.name as team_name, t.offer as team_offer FROM (users u INNER JOIN team_users tu ON (u.id = tu.user_id)) INNER JOIN team t ON (tu.team_id = t.id) WHERE u.email=$1', [username], function(err, result) {
				
				if(err) {
					return done(err)
				}
				else if(result.rows[0] == null) { //if client hasn't got a team
					client.query('SELECT id, firstname, lastname, email, password, birthday, iam, pseudo, city, weapon FROM users WHERE email=$1', [username], function(err, result) {
						if(err) {
							return done(err)
						}	
						if(result.rows[0] == null){
							req.flash('danger', "Incorrect login details.");
							return done(null, false);
						}
						else{
							bcrypt.compare(password, result.rows[0].password, function(err, check) {
								if (err){
									console.log('Error while checking password');
									return done();
								}
								else if (check){
									return done(null, [{email: result.rows[0].email, firstname: result.rows[0].firstname, lastname: result.rows[0].lastname, birthday: result.rows[0].birthday, iam: result.rows[0].iam, pseudo: result.rows[0].pseudo, city: result.rows[0].city, weapon: result.rows[0].weapon, team: {id: null, coach_email: null, name: null, offer: null}}]);
								}
								else{
									req.flash('danger', "Incorrect login details.");
									return done(null, false);
								}
							});
						}
					})
				}
				else { //if client has got a team
					bcrypt.compare(password, result.rows[0].password, function(err, check) {
						if (err){
							console.log('Error while checking password');
							return done();
						}
						else if (check){
							return done(null, [{email: result.rows[0].email, firstname: result.rows[0].firstname, lastname: result.rows[0].lastname, birthday: result.rows[0].birthday, iam: result.rows[0].iam, pseudo: result.rows[0].pseudo, city: result.rows[0].city, weapon: result.rows[0].weapon, team: {id: result.rows[0].team_id, coach_email: result.rows[0].team_coach_email, name: result.rows[0].team_name, offer: result.rows[0].team_offer}}]);
						}
						else{
							req.flash('danger', "Incorrect login details.");
							return done(null, false);
						}
					});
				}
			}))
		}
		
		catch(e){throw (e);}
	};
	
}
))




passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(user, done) {
	done(null, user);
});}