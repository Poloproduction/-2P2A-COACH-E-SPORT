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


var account_routes = function(app) {

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
					dao.createUser(uuidv4(), req.body.firstname, req.body.lastname, req.body.username, pwd, function(err, result) {
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
    
    app.post('/update-private-infos', async function(req, res) {
		try{
			if(req.isAuthenticated()){
				await JSON.stringify(dao.getUserId(req.user[0].email, function(err, result) {
					if(result.rows[0]){
						dao.getUserId(req.body.email, function(err, result) {
							if(result.rows[0] && req.body.email != req.user[0].email) {
								req.flash('warning', 'Email already used.');
								res.redirect('/account');
							}
							else {
								dao.updatePrivateInfos(req.user[0].email, req.body.firstname, req.body.lastname, req.body.email, req.body.birthday.toString(), function(err, result) {
									req.user[0].firstname = req.body.firstname;
									req.user[0].lastname = req.body.lastname;
									req.user[0].email = req.body.email;
									req.user[0].birthday = req.body.birthday;
	
									req.flash('success', 'Private informations updated.');
									res.redirect('/account');
									return;
								});
							}
						});
					}
					else{
						req.flash('danger', "Unknown error n°6870.");
						res.redirect('/account');
					}
					
				}));
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
				await JSON.stringify(dao.getUserId(req.user[0].email, function(err, result) {
					if(result.rows[0]){
						dao.updatePublicInfos(req.user[0].email, req.body.iam, req.body.pseudo, req.body.city, req.body.weapon, function(err, result) {
							req.user[0].iam = req.body.iam;
							req.user[0].pseudo = req.body.pseudo;
							req.user[0].city = req.body.city;
							req.user[0].weapon = req.body.weapon;

							req.flash('success','Public informations updated.');
							res.redirect('/account');
							return;
						});
					}
					else{
						req.flash('danger', "Unknown error n°6870.");
						res.redirect('/account');
					}
					
				}));
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
            try{
                var currentAccountsData = await JSON.stringify(dao.getAccountDataWithTeam(username, function(err, result) {
    
                    if(result.rows[0] == null) { //if client hasn't got a team
                        dao.getAccountDataWithoutTeam(username, function(err, result) {
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
    });
}

module.exports = account_routes;