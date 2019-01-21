var util = require('util');
var express = require('express');
var app = express();
var passport = require("passport");
var paypal = require('paypal-rest-sdk');
var bodyParser = require('body-parser');

var fs = require('fs');
var request = require('request');
var dao = require('./dao.js');
const { Pool, Client } = require('pg')
const bcrypt= require('bcrypt')
const uuidv4 = require('uuid/v4');
//TODO LIST:
//Add forgot password functionality
//Add email confirmation functionality
var teamPrice;

app.use(bodyParser.json());
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
		if(req.isAuthenticated()) {
			req.flash('warning', "You are already connected.");
			res.redirect('/account');
		}
		else {
			res.render('member-area', {title: "Member area", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
	});

	
	app.get('/join', function (req, res, next) {
		res.render('join', {title: "Join", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});
	
	
	app.post('/join', async function (req, res) {
		
		try{
			var pwd = await bcrypt.hash(req.body.password, 5);
			dao.getUserId(req.body.username, function(err, result) {
				if(result.rows[0]) {
					req.flash('warning', "This email address is already registered.");
					res.redirect('/member-area');
				}
				else {
					dao.insertUser(uuidv4(), req.body.firstname, req.body.lastname, req.body.username, pwd, function(err, result) {
						req.flash('success','User created.')
						res.redirect('/member-area');
						return;
					});
				}	
			});
		} 
		catch(e){throw(e)}
	});
	
	app.get('/account', async function (req, res, next) {
		if(req.isAuthenticated()) {
			dao.getUserProfile(req.user[0].team.id, function(err, result) {
				if(result.rows[0]) {
					res.render('account', {title: "Account", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}, teamMates: result.rows});
				} else {
					res.render('account', {title: "Account", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
				}
			});
		}
		else{
			res.redirect('/member-area');
		}
	});
	
	app.get('/login', function (req, res, next) {
		if(req.isAuthenticated()) {
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
		failureRedirect: '/member-area',
		failureFlash: true
		}), function(req, res) {
		if(req.body.remember) {
			req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
			} else {
			req.session.cookie.expires = false; // Cookie expires at end of session
		}
		res.redirect('/account');
	});

	app.get('/create-team', function (req, res, next) {
		if(req.isAuthenticated()){
			if(req.user[0].team.name) {
				req.flash('warning', "Error, you already have a team");
				res.redirect('/account');
			}
			else {
				res.render('create-team', {title: "Create a team", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
			}
		}
		else{
			res.redirect('/member-area');
		}
	});

	app.get('/add-player', async function (req, res, next) {
		if(req.isAuthenticated()){
			if(req.user[0].id == req.user[0].team.coach_id) {
				await JSON.stringify(dao.countTeamUsers(req.user[0].team.id, function(err, result) {
					if(result.rows[0]) {
						if(req.user[0].team.offer != 3 && result.rows[0].count == req.user[0].team.offer * 5) {
							req.flash('danger', 'You have reached the maximum amount of users');
							res.redirect('/account');
						} else {
							res.render('add-player', {title: "Add a player", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}, places: result.rows[0].count});
						}
					} else {
						req.flash('warning', 'An unknown error has occured');
						res.redirect('/account');
					}
				}));
			} else {
				req.flash('danger', 'You are not able to see this page');
				res.redirect('/account');
			}
		} else{
			res.redirect('/member-area');
		}
	});

	app.post('/add-player', async function (req, res) {
		try {
			if(req.isAuthenticated()){
				const client = await pool.connect()
				await client.query('BEGIN')

				transporter = app.get('transporter');
				
				insertCode(req, res, transporter, client, generateCode());
			}
			else{
				res.redirect('/member-area');
			}
		} catch(e){
			throw(e)
		}
	});

	app.get('/join-team', function (req, res, next) {
		if(req.isAuthenticated()){
			if(req.user[0].team.name) {
				req.flash('warning', "Error, you already have a team");
				res.redirect('/account');
			}
			else {
				res.render('join-team', {title: "Join a team", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
			}
		}
		else{
			res.redirect('/member-area');
		}
	});

	app.post('/join-team', async function (req, res) {
		try {
			if(req.isAuthenticated()){
				await JSON.stringify(dao.getTeamCode([req.body.code], function(err, result) {
					if(!result.rows[0]) {
						req.flash('danger', "This code does not exists");
						res.redirect('/join-team');
					} else if(result.rows[0].is_used == true) {
						req.flash('danger', "This code has been already used");
						res.redirect('/join-team');
					} else {
						teamId = result.rows[0].team_id;
						//TODO: Paul. S needs to see this
						dao.countTeamUsersAndGetOffer(teamId, function(err, result) {
							if(result.rows[0]) {
								if(req.user[0].team.offer != 3 && result.rows[0].count == result.rows[0].offer * 5) {
									req.flash('danger', 'This team has reached the maximum amount of users');
									res.redirect('/account');
								} else {
									dao.getUser(req.user[0].email, function(err, result) {
										if(result.rows[0]) {
											userId = result.rows[0].id
			
											dao.useCode(req.body.code, function(err, result) {
												dao.createTeamUsers(teamId, userId, function(err, result) {
													req.user[0].team.id = teamId;
													
													client.query('SELECT * FROM team WHERE id = $1', [teamId], function(err, result) {
														if(err){
															console.log(err);
														}
														else {
															req.user[0].team.coach_id = result.rows[0].coach_id;
															req.user[0].team.name = result.rows[0].name;
															req.user[0].team.offer = result.rows[0].offer;

															client.query('SELECT email FROM users WHERE id = (SELECT coach_id FROM team WHERE id = $1)', [teamId], function(err, result) {
																if(result.rows[0]) {
																	transporter = app.get('transporter');

																	var mailOptions = {
																		from: 'myfortnitecoach@gmail.com',
																		to: result.rows[0].email,
																		subject: 'Someone joined your team !',
																		text: 'Congratulations ! ' + req.user[0].firstname.trim() + ' joined your team !',
																	};
																	
																	transporter.sendMail(mailOptions, function(error, info){
																		if(error) {
																			console.log(error);
																		}
																	});
																}
															});
			
															req.flash('success', 'You have been joined the team');
															res.redirect('/account');
														}
													});
												});
											});
										} else {
											req.flash('warning', 'An unknown error has occured');
											res.redirect('/join-team');
											return;
										}
									});
								}
							} else {
								req.flash('warning', 'An unknown error has occured');
								res.redirect('/account');
								return;
							}
						});
					}
				}));
				client.release();
			}
			else{
				res.redirect('/member-area');
			}
		} catch(e){
			throw(e)
		}
	});

	app.get('/leave-team', async function(req, res) {
		try {
			if(req.isAuthenticated()) {
				if(req.user[0].team.coach_id == req.user[0].id) {
					res.redirect('/delete-team');
				}
				else {
					const client = await pool.connect()
					await client.query('BEGIN')
					await JSON.stringify(client.query('DELETE FROM "team_users" WHERE "user_id"=$1', [req.user[0].id], function(err, result) {
						if(err){console.log(err);}
						else {
							client.query('COMMIT')

							req.user[0].team.id = null;
							req.user[0].team.coach_id = null;
							req.user[0].team.name = null;
							req.user[0].team.offer = null;

							req.flash('success', 'You have left your team successfully.');
							res.redirect('/account');
							return;
						}
					}));
				}
			}
			else {
				res.redirect('/member-area');
			}
		} catch(e){throw(e)}
	});

	app.get('/kick-team', async function(req, res) {
		if(req.isAuthenticated()) {
			if(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(req.query.id)) {
				if(req.user[0].team.coach_id == req.user[0].id) {
					if(req.query.id == req.user[0].team.coach_id) {
						res.redirect('/delete-team');
						return;
					}
	
					const client = await pool.connect()
					await client.query('BEGIN')
	
					await JSON.stringify(client.query('SELECT * FROM team_users WHERE team_id = (SELECT id FROM team WHERE coach_id = $1) AND user_id = $2', [req.user[0].team.coach_id, req.query.id], function(err, result) {
						if(result.rows[0]) {
							client.query('DELETE FROM team_users WHERE user_id = $1', [req.query.id], function(err, result) {
								if(err){console.log(err);}
								else {
									client.query('COMMIT')
									req.flash('success', 'You have successfully kicked the user.');
									res.redirect('/account');
								}
							});
						} else {
							req.flash('danger', 'You cant`t kick user from another team.');
							res.redirect('/account');
						}
					}));
	
					client.release();
				} else {
					req.flash('danger', 'You are not allowed to kick someone.');
					res.redirect('/account');
				}
			} else {
				req.flash('danger', 'This user id is not valid');
				res.redirect('/account');
			}
		} else {
			res.redirect('/member-area');
		}
	});

	app.get('/delete-team', async function(req, res) {
		if(req.isAuthenticated()){
			res.render('delete-team', {title: "Delete my team", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
		else{
			res.redirect('/member-area');
		}
	})

	app.post('/delete-team', async function(req, res) {
		try {
			if(req.isAuthenticated()) {
				if(req.user[0].team.coach_id == req.user[0].id) {
					if(req.body.email.trim() == req.user[0].email.trim()) {
						const client = await pool.connect()
						await client.query('BEGIN')
						await JSON.stringify(client.query('DELETE FROM "team_users" WHERE "team_id"=$1', [req.user[0].team.id], function(err, result) {
							if(err){console.log(err);}
							else {
								client.query('COMMIT')
								client.query('DELETE FROM "team" WHERE "id"=$1', [req.user[0].team.id], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
									}
								})
								req.user[0].team.id = null;
								req.user[0].team.coach_id = null;
								req.user[0].team.name = null;
								req.user[0].team.offer = null;
								req.flash('success', 'Your team has been deleted successfully.');
								res.redirect('/account');
							}
						}))
					} else {
						req.flash('danger', 'You wrote the wrong email, please try again.');
						res.redirect('/delete-team');
					}
				} else {
					req.flash('danger', 'This team is not yours');
					res.redirect('/account');
				}
			} else {
				res.redirect('/member-area');
			}
		}
		catch(e){throw(e)}
	})



	app.post('/update-private-infos', async function(req, res) {
		try{
			if(req.isAuthenticated()){
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "users" WHERE "email"=$1', [req.user[0].email], function(err, result) {
					if(result.rows[0]){

						client.query('SELECT id FROM "users" WHERE "email"=$1', [req.body.email], function(err, result) {
							if(result.rows[0] && req.body.email != req.user[0].email) {
								req.flash('warning', 'Email already used.');
								res.redirect('/account');
							}
							else {
								client.query('UPDATE users SET firstname=$2, lastname=$3, email=$4, birthday=$5 WHERE email=$1', [req.user[0].email, req.body.firstname, req.body.lastname, req.body.email, req.body.birthday.toString()], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
										
										req.user[0].firstname = req.body.firstname;
										req.user[0].lastname = req.body.lastname;
										req.user[0].email = req.body.email;
										req.user[0].birthday = req.body.birthday;
		
										req.flash('success', 'Private informations updated.');
										res.redirect('/account');
										return;
									}
								});
							}
						});
					}
					else{
						req.flash('danger', "Unknown error n°6870.");
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
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "team" WHERE "name"=$1', [payment.transactions[0].custom], function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						res.redirect('/account');
					}
					else{
						client.query('SELECT * FROM users WHERE email=$1', [req.user[0].email], function(err, result) {
							if(!result.rows[0]){
								req.flash('danger', "User account not found");
								res.redirect('/login');
							}
							else{
								req.user[0].id = result.rows[0].id;
							}
						});
						client.query('SELECT * FROM team_users WHERE user_id=$1', [req.user[0].id], function(err, result) {
							if(result.rows[0]){
								req.flash('danger', "You are already in a team");
								res.redirect('/account');
							}
							else{
								var team_id = uuidv4();
								client.query('INSERT INTO team (id, coach_id, name, offer) VALUES ($1, $2, $3, $4)', [team_id, req.user[0].id, payment.transactions[0].custom, payment.transactions[0].description], function(err, result) {
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

										req.user[0].team.coach_id = req.user[0].id;
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
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "team" WHERE "name"=$1', [payment.transactions[0].custom], function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						res.redirect('/account');
					}
					else{
						client.query('SELECT * FROM users WHERE email=$1', [req.user[0].email], function(err, result) {
							if(!result.rows[0]){
								req.flash('danger', "User account not found");
								res.redirect('/login');
							}
							else{
								req.user[0].id = result.rows[0].id;
								client.query('SELECT * FROM team_users WHERE user_id=$1', [req.user[0].id], function(err, result) {
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
			var currentAccountsData = await JSON.stringify(client.query('SELECT u.id as id, u.firstname as firstname, u.lastname as lastname, u.email as email, u.password as password, u.birthday as birthday, u.iam as iam, u.pseudo as pseudo, u.city as city, u.weapon as weapon, t.id as team_id, t.coach_id as team_coach_id, t.name as team_name, t.offer as team_offer FROM (users u INNER JOIN team_users tu ON (u.id = tu.user_id)) INNER JOIN team t ON (tu.team_id = t.id) WHERE u.email=$1', [username], function(err, result) {
				
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
								if(err){
									return done();
								}
								else if(check){
									return done(null, [{id: result.rows[0].id, email: result.rows[0].email, firstname: result.rows[0].firstname, lastname: result.rows[0].lastname, birthday: result.rows[0].birthday, iam: result.rows[0].iam, pseudo: result.rows[0].pseudo, city: result.rows[0].city, weapon: result.rows[0].weapon, team: {id: null, coach_id: null, name: null, offer: null}}]);
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
						if(err){
							return done();
						}
						else if(check){
							return done(null, [{id: result.rows[0].id, email: result.rows[0].email, firstname: result.rows[0].firstname, lastname: result.rows[0].lastname, birthday: result.rows[0].birthday, iam: result.rows[0].iam, pseudo: result.rows[0].pseudo, city: result.rows[0].city, weapon: result.rows[0].weapon, team: {id: result.rows[0].team_id, coach_id: result.rows[0].team_coach_id, name: result.rows[0].team_name, offer: result.rows[0].team_offer}}]);
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

function generateCode() {
	var code = "";
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	for (var i = 0; i < 5; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return code;
}

function insertCode(req, res, transporter, client, code){
	client.query('SELECT team_id FROM team_codes WHERE code = $1', [code], function(err, result) {
		if(result.rows[0]){
			insertCode(client, generateCode());
		}
		else {
			client.query('INSERT INTO team_codes (team_id, code) VALUES ($1, $2)', [req.user[0].team.id, code], function(err, result) {
				if(err){console.log(err);}
				else {
					client.query('COMMIT')

					var mailOptions = {
						from: 'myfortnitecoach@gmail.com',
						to: req.body.email,
						subject: 'Join our fortnite team !',
						text: 'Your code to join the team is: ' + code + ' ! Please connect you to our website to use it.',
					};
					
					transporter.sendMail(mailOptions, function(error, info){
						if(error) {
							console.log(error);
						} else {
							req.flash('success', 'The code has been sent by email !');
							res.redirect('/account');
						}
					});
				}
			});
		}
	});

	client.release();
}