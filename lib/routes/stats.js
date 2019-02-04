var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var request = require('request');

app.use(bodyParser.json());
app.use(express.static('public'));

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