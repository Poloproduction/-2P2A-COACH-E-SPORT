const { Pool, Client } = require('pg')

const databaseUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

const pool = new Pool({
	connectionString: databaseUrl,
});

var dao = {
    getUserProfile:async function(teamId,callback) {
        const client = await pool.connect()
		await client.query('BEGIN')
        client.query('SELECT tu.team_id AS team_id, tu.user_id AS user_id, u.firstname AS firstname, u.lastname AS lastname, u.weapon AS weapon, u.pseudo AS pseudo FROM team_users tu INNER JOIN users u ON (tu.user_id = u.id) WHERE team_id = $1', [teamId], function(err,result){
            client.release();
            callback(err,result);
        });
    }
}

module.exports = dao;