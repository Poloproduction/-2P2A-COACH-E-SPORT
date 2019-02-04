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
var initCookie = {
      firstname: "cookie",
      lastname: "cookie",
      username: "cookie@hotmail.fr",
      password: "test"
    };  
var updatePrivate = {
      firstname: "cookie",
      lastname: "cookie",
      email: "cookie@hotmail.fr",
      birthday: '1994/08/12'
    };  
var reqo_connection = {
  username: "alexandre@hotmail.fr",
  password: "test"
};
var cookie_connection = {
  username: "cookie@hotmail.fr",
  password: "test"
};
var bad_reqo_connection = {
  username: "bad@hotmail.fr",
  password: "badtest"
};

var create_team_test = {
  name : "2P2Ateam",
  offer : "bronze"
}

var coockie;

var testUser = "";
const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:mysecretpassword@localhost:5432/postgres';

const pool = new Pool({ 
      connectionString: databaseUrl,
});

// ----------------------------------------------------------------------------------------------
beforeAll(async () => {
  await request(app).post("/join").send(initCookie);
  await request(app)
      .post("/login")
      .send(cookie_connection)
      .then(res => {
          coockie = res
          .headers['set-cookie'][0]
          .split(',')
          .map(item => item.split(';')[0])
          .join(';')
      });
})

describe("Test the get functions", function() {
  test("Get / respond 200", function(done) {
    request(app)
        .get('/')
        .set('Accept', 'application/json')
        .expect(200, done);
  })
  test("Get /member-area respond 200", function(done) {
    request(app)
        .get('/member-area')
        .set('Accept', 'application/json')
        .expect(200, done);
  })
  test("Get /account respond 302", function(done) {
    request(app)
        .get('/account')
        .set('Accept', 'application/json')
        .expect(302, done);
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


// connection and navigation tests
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
        expect(data.text).toEqual('Found. Redirecting to /member-area');
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

  test('It should redirect to / because user already exist', async () => {
    var data = await request(app).post("/join").send(reqo);
    expect(data.text).toEqual('Found. Redirecting to /');
  });
});

// bcrypt test
describe("Test the bcrypt hash", () => {
  test('Compare pasw in base to password', async (done) => {
    try {
      const client = await pool.connect()
      //const psw = await bcrypt.hash(reqo.password, 5)
      await client.query('BEGIN')
      await JSON.stringify(client.query('SELECT * FROM "users" WHERE "email"=$1', [reqo.username], function(err, result) {
        bcrypt.compare(reqo.password, result.rows[0].password, function(err, res) {
          expect(res).toBe(true);
        });
      }));
      client.release();
    }  
    catch(e){throw(e)}
    done();
  });
});

// login test
describe("Test the login post", () => {
  test("It should redirect to /account", async () => {
    const data = await request(app)
      .post("/login")
      .send(reqo_connection);
    expect(data.statusCode).toBe(302);
   expect(data.text).toEqual('Found. Redirecting to /account');
  });
  test("It shouldn't redirect to /member-area", async () => {
    const data = await request(app)
      .post("/login")
      .send(bad_reqo_connection);
    expect(data.statusCode).toBe(302);
    expect(data.text).toEqual('Found. Redirecting to /member-area');
  });
  
});

describe("Test change my private informations", () => {
  test("It should redirect to /account", async () => {
    request(app)
        .get('/login')
        .set('Cookie',coockie)
        .then(res => {
          res.headers['location'][0]
          expect(res.headers['location']).toEqual('/account');
        })
  })
  test("It should set my birthday to 12/08/94", async () => {
    request(app)
        .post('/update-private-infos')
        .send(updatePrivate)
        .set('Cookie',coockie);
    try{
      const client = await pool.connect()
      await client.query('BEGIN')
      await JSON.stringify(client.query('SELECT * FROM "users" WHERE "email"=$1', [updatePrivate.email], function(err, result) {
        var noSpace = (result.rows[0].birthday);
        console.log(noSpace);
      }));
      client.release();
    } 
    catch(e){throw(e)}
  })
})

describe("Test create team", () => {
  test("It should stay on /create-team", async() => {
    request(app)
      .get('/create-team')
      .set('Cookie',coockie)
      .expect(200)
      .then(res => {
        expect(res.headers['content-type']).toBe('text/html; charset=utf-8');
        console.log(res.headers['content-type']);
      })
})
  test("It should redirect on paypal",async() => {
    request(app)
      .post("/pay")
      .send(create_team_test)
  })         
})


// ----------------------------------------------------------------
describe('End of tests', ()=> {
  test('Delete the testUser', async()=> {
    try{
      const client = await pool.connect()
      await client.query('BEGIN')
      await client.query('DELETE FROM "users" WHERE "email" = $1', [reqo.username], function(err, result) {
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


  test('Delete the cookieUser', async()=> {
    try{
      const client = await pool.connect()
      await client.query('BEGIN')
      await client.query('DELETE FROM "users" WHERE "email" = $1', [initCookie.username], function(err, result) {
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
      await JSON.stringify(client.query('SELECT * FROM "users" WHERE "email"=$1', [initCookie.username], function(err, result) {
        expect(result.rowCount).toBe(0);
      }));
      client.release();
    } 
    catch(e){throw(e)}
  })
})

// ----------------------------------------------------------------------
