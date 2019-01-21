const { Pool, Client } = require('pg')

const databaseUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

const pool = new Pool({
	connectionString: databaseUrl,
});

var dao = {

    getUserProfile:async function(teamId, callback) {
        const client = await pool.connect()
		await client.query('BEGIN')
        client.query('SELECT tu.team_id AS team_id, tu.user_id AS user_id, u.firstname AS firstname, u.lastname AS lastname, u.weapon AS weapon, u.pseudo AS pseudo FROM team_users tu INNER JOIN users u ON (tu.user_id = u.id) WHERE team_id = $1', [teamId], function(err, result){
            if(err){console.log(err);}
            else {
                client.release();
                callback(err, result);
            }
        });
    },

    getUserId:async function(email, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('SELECT id FROM "users" WHERE "email"=$1', [email], function(err, result) {
            if(err){console.log(err);}
            else {
                client.release();
                callback(err, result);
            }
        });
    },

    insertUser:async function(id, firstname, lastname, email, password, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('INSERT INTO users (id, "firstname", "lastname", email, password) VALUES ($1, $2, $3, $4, $5)', [id, firstname, lastname, email, password], function(err, result) {
            if(err){console.log(err);}
            else {
			    client.query('COMMIT')
                client.release();
                callback(err, result);
            }
        });
    },

    countTeamUsers:async function(teamId, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('SELECT COUNT(*) AS count FROM team_users WHERE team_id = $1', [teamId], function(err, result) {
            if(err){console.log(err);}
            else {
                client.release();
                callback(err, result);
            }
        });
    },

    getTeamCode:async function(code, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('SELECT * FROM team_codes WHERE code = $1', [code], function(err, result) {
            if(err){console.log(err);}
            else {
                client.release();
                callback(err, result);
            }
        });
    },

    countTeamUsersAndGetOffer:async function(teamId, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('SELECT t.id, COUNT(tu.*) AS count, t.offer AS offer FROM team_users tu INNER JOIN team t ON t.id = tu.team_id WHERE team_id = $1 GROUP BY t.id, t.offer', [teamId], function(err, result) {
            if(err){console.log(err);}
            else {
                client.release();
                callback(err, result);
            }
        });
    },

    getUser:async function(email, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('SELECT * FROM users WHERE email=$1', [email], function(err, result) {
            if(err){console.log(err);}
            else {
                client.release();
                callback(err, result);
            }
        });
    },

    useCode:async function(code, callback) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('UPDATE team_codes SET is_used = TRUE WHERE code = $1', [code], function(err, result) {
            if(err){console.log(err);}
            else {
                client.query('COMMIT')
                client.release();
                callback(err, result);
            }
        });
    },

    createTeamUsers:async function(teamId, userId) {
        const client = await pool.connect()
        await client.query('BEGIN')
        client.query('INSERT INTO team_users (team_id, user_id) VALUES ($1, $2)', [teamId, userId], function(err, result) {
            if(err){console.log(err);}
            else {
                client.query('COMMIT')
                client.release();
                callback(err, result);
            }
        });
    }
}

module.exports = dao;