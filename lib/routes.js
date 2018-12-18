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
			// TODO Redirect to /account if user has already a team
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
						client.query('UPDATE users SET iam=$2, pseudo=$3, city=$4, weapon=$5, skin=$6 WHERE email=$1', [req.user[0].email, req.body.iam, req.body.pseudo, req.body.city, req.body.weapon, req.body.skin], function(err, result) {
							if(err){console.log(err);}
							else {
							client.query('COMMIT')
								
								req.user[0].iam = req.body.iam;
								req.user[0].pseudo = req.body.pseudo;
								req.user[0].city = req.body.city;
								req.user[0].weapon = req.body.weapon;
								req.user[0].skin = req.body.skin;

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

	app.post('/create-team', async function(req, res) {
		try{
			if(req.isAuthenticated()){
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "team" WHERE "name"=$1', [req.body.name], function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						console.log('Error: team already exists');
						res.redirect('/account');
					}
					else{
						client.query('SELECT teamname FROM users WHERE email=$1', [req.user[0].email], function(err, result) {
							if(result.rows[0].teamname != null){
								req.flash('danger', "You are already in a team");
								console.log('Error: user already in a team');
								res.redirect('/account');
							}
							else{
								client.query('INSERT INTO team (id, coachemail, name, nbmembers) VALUES ($1, $2, $3, $4)', [uuidv4(), req.user[0].email, req.body.name, req.body.nbmembers], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
									
										req.user[0].teamname = req.body.name;
									}
								});
								client.query('UPDATE users SET "teamname"=$1 WHERE "email"=$2', [req.body.name, req.user[0].email], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
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
			else{
				res.redirect('/member-area');
			}	
		}
		catch(e){throw(e)}
	});
	
	app.get('/pay-success', async function(req, res){
				console.log("REQ.QUERY get /pay-success: " + req.query.token);
				console.log("REQ.QUERY get /pay-success: " + req.query.paymentId);
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "team" WHERE "name"=$1', [req.query.team], function(err, result) {
					if(result.rows[0]){
						req.flash('danger', "Team already exists");
						console.log('Error: team already exists');
						res.redirect('/account');
					}
					else{
						client.query('SELECT teamname FROM users WHERE email=$1', [req.user[0].email], function(err, result) {
							if(result.rows[0].teamname != null){
								req.flash('danger', "You are already in a team");
								console.log('Error: user already in a team');
								res.redirect('/account');
							}
							else{
								client.query('INSERT INTO team (id, coachemail, name, nbmembers) VALUES ($1, $2, $3, $4)', [uuidv4(), req.user[0].email, req.query.team, req.query.nbmembers], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
									
										req.user[0].teamname = req.query.team;
									}
								});
								client.query('UPDATE users SET "teamname"=$1 WHERE "email"=$2', [req.query.team, req.user[0].email], function(err, result) {
									if(err){console.log(err);}
									else {
										client.query('COMMIT')
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
	});

	app.post('/buy' , ( req , res ) => {
		//TODO réparer avec apostrophe et espaces
		var return_url = "http://localhost:5000/pay-success?team="+req.body.name+"&nbmembers="+req.body.nbmembers;
		var payment = {
				"intent": "authorize",
		"payer": {
			"payment_method": "paypal"
		},
		"redirect_urls": {
			"return_url": return_url,
			"cancel_url": "http://localhost:5000/pay-err"
		},
		"transactions": [{
			"amount": {
				//TODO conditions pour le tarif en fonction du choix de formule
				"total": 39.00,
				"currency": "USD"
			},
			"description": "Buy a team"
		}]
		}
		
		
		// call the create Pay method 
		createPay( payment ) 
			.then( ( transaction ) => {
				var id = transaction.id;
				var links = transaction.links;
				var counter = links.length;
				while( counter -- ) {
					if (links[counter].method == 'REDIRECT') {
						// redirect to paypal where user approves the transaction
						console.log("TRANSACTION:" + transaction.id);
						return res.redirect( links[counter].href );
						
					}
				}
			})
			.catch( ( err ) => { 
				console.log( err );
				req.flash('danger', "Error, please try again");
				res.redirect('/create-team');
			});
	});

passport.use('local', new  LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
	
	loginAttempt();
	async function loginAttempt() {
		
		
		const client = await pool.connect()
		try{
			await client.query('BEGIN')
			var currentAccountsData = await JSON.stringify(client.query('SELECT id, "firstname", "lastname", "email", "password", "birthday", "iam", "pseudo", "city", "weapon", "skin", "teamname" FROM "users" WHERE "email"=$1', [username], function(err, result) {
				
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
							return done(null, [{email: result.rows[0].email, firstname: result.rows[0].firstname, lastname: result.rows[0].lastname, birthday: result.rows[0].birthday, iam: result.rows[0].iam, pseudo: result.rows[0].pseudo, city: result.rows[0].city, weapon: result.rows[0].weapon, skin: result.rows[0].skin, teamname: result.rows[0].teamname}]);
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



//helper functions 
var createPay = ( payment ) => {
    return new Promise( ( resolve , reject ) => {
        paypal.payment.create( payment , function( err , payment ) {
         if ( err ) {
             reject(err); 
         }
        else {
            resolve(payment); 
        }
        }); 
    });
}	