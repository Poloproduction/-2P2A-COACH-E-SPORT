var express = require('express');
var app = express();
var dao = require('../dao.js');
const uuidv4 = require('uuid/v4');

var diary_routes = function (app) {
    app.get('/diary', async function (req, res, next) {
        if(req.isAuthenticated()){
            if(req.user[0].team.id) {
                eventTypes = null;

                dao.getEventTypes(function(err, result) {
                    eventTypes = result.rows;

                    dao.getEventsByTeam(req.user[0].team.id, function(err, result) {
                        if(result.rows[0]) {
                            res.render('diary', {title: "My Diary", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}, eventTypes: eventTypes, teamEvents: result.rows});
                        } else {
                            res.render('diary', {title: "My Diary", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}, eventTypes: eventTypes, teamEvents: false});
                        }
                    });
                });
            } else {
                req.flash('danger', 'You are not able to see this page');
                res.redirect('/account'); 
            }
        } else{
            res.redirect('/member-area');
        }
    });

    app.get('/create-event', async function (req, res, next) {
        if(req.isAuthenticated()){
            if(req.user[0].id == req.user[0].team.coach_id) {
                dao.getEventTypes(function(err, result) {
                    res.render('create-event', {title: "Create event", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}, eventTypes: result.rows});
                });
            } else {
                req.flash('danger', 'You are not able to see this page');
                res.redirect('/account');
            }
        } else{
            res.redirect('/member-area');
        }
    });

    app.post('/create-event', async function (req, res) {
		try {
            if(req.isAuthenticated()){
                if(req.user[0].id == req.user[0].team.coach_id) {
                    if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(req.body.date)) {
                        req.flash('danger', 'Your date format is incorrect');
                        res.redirect('/create-event');
                        return;
                    }

                    var date = new Date(req.body.date);
                    var description = req.body.description;
                    var type = req.body.type;

                    if(req.body.description == "") {
                        req.flash('danger', 'You have to write a description');
                        res.redirect('/create-event');
                        return;
                    }

                    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(req.body.type)) {
                        req.flash('danger', 'The type selected is incorrect');
                        res.redirect('/create-event');
                        return;
                    }

                    var eventId = uuidv4();

                    dao.createEvent(eventId, req.user[0].team.id, date, description, type, function(err, result) {
                        req.flash('success', "Event created!")
                        res.redirect('/diary');
                        return;
                    });
                } else {
                    req.flash('danger', 'You are not able to see this page');
                    res.redirect('/account');
                }
            } else {
                res.redirect('/member-area');
            }
		} catch(e){
			throw(e)
		}
    });
}

// new Date('2019-02-17 19:04:00');

module.exports = diary_routes;