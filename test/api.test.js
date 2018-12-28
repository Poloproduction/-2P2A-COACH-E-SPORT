var app = require("../app");
var request = require("supertest");
var bcrypt = require("bcrypt");
// close the server after each test

// ----------------------------------------------------------------------------------------------

describe("Test the / get", function() {
  test("Get / respond 200", function(done) {
    request(app)
        .get('/')
        .set('Accept', 'application/json')
        .expect(200, done);
  })
  test("Get /account respond ", function(done) {
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

