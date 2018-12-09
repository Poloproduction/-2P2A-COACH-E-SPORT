var util = require('util');
var express = require('express');
var app = express();
var passport = require("passport");

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
//const connectionString = process.env.DATABASE_URL;

var currentAccountsData = [];

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
});

module.exports = function (app) {
	
	app.get('/', function (req, res, next) {
		res.render('index', {title: "Home", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		
		console.log(req.user);
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
							console.log(result)
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
		
		console.log(req.isAuthenticated());
		req.logout();
		console.log(req.isAuthenticated());
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

	app.post('/account', async function (req, res) {
		try{
			if(req.isAuthenticated()){
				const client = await pool.connect()
				await client.query('BEGIN')
				await JSON.stringify(client.query('SELECT id FROM "users" WHERE "email"=$1', [req.user[0].email], function(err, result) {
					if(result.rows[0]){
						client.query('UPDATE users SET firstname=$2, lastname=$3, email=$4, birthday=$5, iam=$6, pseudo=$7, city=$8 WHERE email=$1', [req.user[0].email, req.body.firstname, req.body.lastname, req.body.email, req.body.birthday.toString(), req.body.iam, req.body.pseudo, req.body.city], function(err, result) {
							if(err){console.log(err);}
							else {
							client.query('COMMIT')
								
								req.user[0].firstname = req.body.firstname;
								req.user[0].lastname = req.body.lastname;
								req.user[0].email = req.body.email;
								req.user[0].birthday = req.body.birthday;
								req.user[0].iam = req.body.iam;
								req.user[0].pseudo = req.body.pseudo;
								req.user[0].city = req.body.city;

								console.log(req.session.user);
								req.flash('success','User updated.');
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

	app.get('/create-team', function (req, res, next) {
		if(req.isAuthenticated()){
			res.render('create-team', {title: "Create a team", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
		}
		else{
			// TODO Redirect to /account if user has already a team
			res.redirect('/member-area');
		}
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
						//console.log('email: ' + req.user[Øk]);
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
									
										req.flash('success','Team created.');
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

passport.use('local', new  LocalStrategy({passReqToCallback : true}, (req, username, password, done) => {
	
	loginAttempt();
	async function loginAttempt() {
		
		
		const client = await pool.connect()
		try{
			await client.query('BEGIN')
			var currentAccountsData = await JSON.stringify(client.query('SELECT id, "firstname", "lastname", "email", "password", "birthday", "iam", "pseudo", "city", "teamname" FROM "users" WHERE "email"=$1', [username], function(err, result) {
				
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
							return done(null, [{email: result.rows[0].email, firstname: result.rows[0].firstname, lastname: result.rows[0].lastname, birthday: result.rows[0].birthday, iam: result.rows[0].iam, pseudo: result.rows[0].pseudo, city: result.rows[0].city, teamname: result.rows[0].teamname}]);
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