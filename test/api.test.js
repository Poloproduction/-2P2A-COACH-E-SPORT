var app = require("../app");
var request = require("supertest");
var bcrypt = require("bcrypt");
// close the server after each test

const { Pool, Client } = require('pg')


var reqo = {
      firstname: "alex",
      lastname: "armando",
      username: "alexandre@hotmail.fr",
      password: "test"
    };

var testUser = "";
const databaseUrl = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

const pool = new Pool({ 
      connectionString: databaseUrl,
});

// ----------------------------------------------------------------------------------------------

describe("Test the get functions", function() {
  test("Get / respond 200", function(done) {
    request(app)
        .get('/')
        .set('Accept', 'application/json')
        .expect(200, done);
  })
  test("Get /account respond 200", function(done) {
    request(app)
        .get('/member-area')
        .set('Accept', 'application/json')
        .expect(200, done);
  })
})


describe("Test the login post", () => {
  test("It should set a cookie in header", async () => {

    result = {
      username: "michel",
      password: "michelpass"
    };

    const response = await request(app)
      .post("/login")
      .send(result);
    expect(response.statusCode).toBe(302);
    //console.log(response.header["set-cookie"]);
    expect(response.header["set-cookie"]).toBeDefined();
    expect(response.header["set-cookie"]).toEqual(expect.arrayContaining([expect.stringMatching("connect.sid=")]));
  });
  
});

describe("Test the /join post", () => {
  test('It should insert a new user in database', async () => {

    var data = await request(app).post("/join").send(reqo);

    try{
      const client = await pool.connect()
      await client.query('BEGIN')
      await JSON.stringify(client.query('SELECT * FROM "users" WHERE "email"=$1', [reqo.username], function(err, result) {
        testUser=result.rows[0].email;
        var noSpace = (result.rows[0].firstname).replace(/ /g,"");
        expect(noSpace).toEqual(reqo.firstname);
        var noSpace = (result.rows[0].lastname).replace(/ /g,"");
        expect(noSpace).toEqual(reqo.lastname);
        var noSpace = (result.rows[0].email).replace(/ /g,"");
        expect(noSpace).toEqual(reqo.username);
      }));
      client.release();
    } 
    catch(e){throw(e)}
  });
  test('post respond 302', function (done) {
    request(app)
      .post('/join')
      .send(reqo)
      .set('Accept', 'application/json')
      .expect(302);
      done();
  });
});

describe('End of tests', ()=> {
  test('Delete the testUser', async()=> {
    try{
      const client = await pool.connect()
      await client.query('BEGIN')
      await client.query('DELETE FROM "users" WHERE "email" = $1', [testUser], function(err, result) {
        expect(result.rowCount).toBe(1);
        client.query('COMMIT')
      });
      client.release();
    } 
    catch(e){throw(e)}
  })
  test('Table users does not contains the testUser', async()=> {
    try{
      const client = await pool.connect()
      await client.query('BEGIN')
      await JSON.stringify(client.query('SELECT * FROM "users" WHERE "email"=$1', [reqo.username], function(err, result) {
        expect(result.rowCount).toBe(0);
      }));
      client.release();
    } 
    catch(e){throw(e)}
  })
})