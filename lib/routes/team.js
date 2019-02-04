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

var team_routes = function(app) {

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
				transporter = app.get('transporter');
				insertCode(req, res, transporter, generateCode());
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
				await JSON.stringify(dao.getTeamCode(req.body.code, function(err, result) {
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
													
													dao.getTeam(teamId, function(err, result) {
														req.user[0].team.coach_id = result.rows[0].coach_id;
														req.user[0].team.name = result.rows[0].name;
														req.user[0].team.offer = result.rows[0].offer;

														dao.getCoachEmail(teamId, function(err, result) {
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
					await JSON.stringify(dao.leaveTeam(req.user[0].id, function(err, result) {
						req.user[0].team.id = null;
						req.user[0].team.coach_id = null;
						req.user[0].team.name = null;
						req.user[0].team.offer = null;

						req.flash('success', 'You have left your team successfully.');
						res.redirect('/account');
						return;
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

					await JSON.stringify(dao.checkUserInTeam(req.user[0].team.coach_id, req.query.id, function(err, result) {
						if(result.rows[0]) {
							dao.kickUser(req.query.id, function(err, result) {
								req.flash('success', 'You have successfully kicked the user.');
								res.redirect('/account');
							});
						} else {
							req.flash('danger', 'You cant`t kick user from another team.');
							res.redirect('/account');
						}
					}));

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
    });
    
    app.post('/delete-team', async function(req, res) {
		try {
			if(req.isAuthenticated()) {
				if(req.user[0].team.coach_id == req.user[0].id) {
					if(req.body.email.trim() == req.user[0].email.trim()) {
						await JSON.stringify(dao.dropTeamInTeamUsers(req.user[0].team.id, function(err, result) {
							dao.dropTeam(req.user[0].team.id, function(err, result) {});
							req.user[0].team.id = null;
							req.user[0].team.coach_id = null;
							req.user[0].team.name = null;
							req.user[0].team.offer = null;
							req.flash('success', 'Your team has been deleted successfully.');
							res.redirect('/account');
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
	});
}

function insertCode(req, res, transporter, code){
	dao.getTeamIdFromCodes(code, function(err, result) {
		if(result.rows[0]){
			insertCode(req, res, transporter, generateCode());
		}
		else {
			dao.createCode(req.user[0].team.id, code, function(err, result) {
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
			});
		}
	});
}

module.exports = team_routes;