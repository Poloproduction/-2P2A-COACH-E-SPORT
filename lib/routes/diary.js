var express = require('express');
var app = express();
var dao = require('../dao.js');

var diary_routes = function (app) {
    app.get('/diary', async function (req, res, next) {
        if(req.isAuthenticated()){
            if(req.user[0].team.id) {
                res.render('diary', {title: "My Diary", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
            } else {
                req.flash('danger', 'You are not able to see this page');
                res.redirect('/account'); 
            }
        } else{
            res.redirect('/member-area');
        }
    });

    app.get('/add-training', async function (req, res, next) {
        if(req.isAuthenticated()){
            if(req.user[0].id == req.user[0].team.coach_id) {
                // Render the page
            } else {
                req.flash('danger', 'You are not able to see this page');
                res.redirect('/account');
            }
        } else{
            res.redirect('/member-area');
        }
    });
}

module.exports = diary_routes;