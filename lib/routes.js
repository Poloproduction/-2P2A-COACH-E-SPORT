var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var account_routes = require('./routes/account.js');
var team_routes = require('./routes/team.js');
var payment_routes = require('./routes/payment.js');
var stats_routes = require('./routes/stats.js');
var diary_routes = require('./routes/diary.js');

app.use(bodyParser.json());
app.use(express.static('public'));

module.exports = function (app) {

	app.get('/', function (req, res, next) {
		res.render('index', {title: "Home", userData: req.user, messages: {danger: req.flash('danger'), warning: req.flash('warning'), success: req.flash('success')}});
	});

	account_routes(app);
	team_routes(app);
	payment_routes(app);
	stats_routes(app);
	diary_routes(app);
}