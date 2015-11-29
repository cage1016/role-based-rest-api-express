var superagent = require('superagent')
var expect = require('expect.js')
var util = require('./js/util.js');
var token;

describe('rest auth api', function(done){
  var username;
  var password;
  var permissions;

  it('insert a new username and password (access credentials) with a \'create-an-object\' permission', function(done){
    superagent.post('http://localhost:3000/signup')
      .send({ 
        username: 'admin',
        password: 'admin_password',
        // list of actions that can be done by this user
        permissions: [ 'create-an-object' ]
      })
      .end(function(e, res){
        //console.log(res.body[0]);
        expect(e).to.eql(null);
        expect(res.body[0]._id.length).to.eql(24);
        username = res.body[0].username;
        password = res.body[0].password;
        permissions = res.body[0].permissions;
        done();
      })
  });

  it('authenticate using a valid credential', function(done){
    superagent.post('http://localhost:3000/authenticate')
      .send({
        username: username,
        password: password
      })
      .end(function(e, res){
        //console.log(res.body)
        expect(e).to.eql(null);
        expect(res.body.success).to.eql(true);
        token = res.body.token;
        done();
      })
  });

  it('authenticate using an invalid username', function(done){
    superagent.post('http://localhost:3000/authenticate')
      .send({
        username: username + "wrong",
        password: password
      })
      .end(function(e,res){
        //console.log(res.body)
        expect(e).to.eql(null);
        expect(res.body.success).to.eql(false);
        done();
      })
  });

  it('authenticate using an invalid password', function(done){
    superagent.post('http://localhost:3000/authenticate')
      .send({
        username: username,
        password: password + "wrong"
      })
      .end(function(e,res){
        //console.log(res.body)
        expect(e).to.eql(null);
        expect(res.body.success).to.eql(false);
        done();
      })
  });

});

describe('express rest api server available to all user regardless the user\'s permissions', function(){
  var id

  it('posts an object', function(done){
    superagent.post('http://localhost:3000/api/v1/collections/test?token=' + token)
      .send({ name: 'John'
        , email: 'john@rpjs.co'
      })
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(res.body.length).to.eql(1)
        expect(res.body[0]._id.length).to.eql(24)
        id = res.body[0]._id
        done()
      })
  })

  it('retrieves an object using an invalid token', function(done){
    superagent.get('http://localhost:3000/api/v1/collections/test/'+id + '?token=' + token + "invalid")
      .end(function(e, res){
        //console.log(res.body)
        expect(e).to.eql(null)
        expect(res.body.success).to.eql(false); // Authentication failed; Should expect 'success: false'
        done();
      })
  })


  it('retrieves an object', function(done){
    superagent.get('http://localhost:3000/api/v1/collections/test/'+id + '?token=' + token)
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(typeof res.body).to.eql('object')
        expect(res.body._id.length).to.eql(24)
        expect(res.body._id).to.eql(id)
        expect(res.body.name).to.eql('John')
        done()
      })
  })

  it('retrieves a collection', function(done){
    superagent.get('http://localhost:3000/api/v1/collections/test?token=' + token)
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(res.body.length).to.be.above(0)
        expect(res.body.map(function (item){return item._id})).to.contain(id)
        done()
      })
  })

  it('updates an object', function(done){
    superagent.put('http://localhost:3000/api/v1/collections/test/'+id+ '?token=' + token)
      .send({name: 'Peter'
        , email: 'peter@yahoo.com'})
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(typeof res.body).to.eql('object')
        expect(res.body.msg).to.eql('success')
        done()
      })
  })

  it('checks an updated object', function(done){
    superagent.get('http://localhost:3000/api/v1/collections/test/'+id+ '?token=' + token)
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(typeof res.body).to.eql('object')
        expect(res.body._id.length).to.eql(24)
        expect(res.body._id).to.eql(id)
        expect(res.body.name).to.eql('Peter')
        done()
      })
  })

  it('removes an object', function(done){
    superagent.del('http://localhost:3000/api/v1/collections/test/'+id+ '?token=' + token)
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(typeof res.body).to.eql('object')
        expect(res.body.msg).to.eql('success')
        done()
      })
  })

  it('checks an removed object', function(done){
    superagent.get('http://localhost:3000/api/v1/collections/test?token=' + token)
      .end(function(e, res){
        // console.log(res.body)
        expect(e).to.eql(null)
        expect(res.body.map(function (item){return item._id})).to.not.be(id)
        done()
      })
  })

})

describe('Testing function check_permissions()', function(){
  it('user have the require permissions', function(){
    expect(util.check_permissions(
      ['a','b'], // user's permissions
      ['a','b'], // permissions required
      function (){ return true; }, 
      function (){ return false;} 
    )).to.eql(true);
  });

  it('user don\'t have the required permissions', function(){
    expect(util.check_permissions(
      ['a'], // user's permissions
      ['b','c'], // permisions required
      function (){ return true; },
      function (){ return false; }
    )).to.eql(false);
  }); 

  it('user have more permissions than amount required', function(){
    expect(util.check_permissions(
      ['a','b','c'], // user's permissions
      ['a','b'], // user's permssions
      function (){ return true; },
      function (){ return false; }
    )).to.eql(true);
  });

   it('user have no permissions', function(){ 
     expect(util.check_permissions(
       [], // user's permissions
       ['a','b'], // user's permssions
       function (){ return true; },
       function (){ return false; }
     )).to.eql(false);
   });

  it('user\'s permissions is undefined', function(){
    expect(util.check_permissions(
      undefined, // user's permissions
      ['a','b','c'], // user's permssions
      function (){ return true; },
      function (){ return false; }
     )).to.eql(false);
   });

  it('no permissions is required', function(){
    expect(util.check_permissions(
      ['a','b','c'], // user's permissions                          
      undefined, // user's permssions
      function (){ return true; },
      function (){ return false; }
    )).to.eql(true);
  });

  it('have the required permissions but no callback function defined', function(){
    expect(util.check_permissions(
      ['a','b'], // user's permissions
      ['a','b'], // user's permssions
      undefined,
      function (){ return false; }
    )).to.eql(true);
  });

  it('don\'t have the required permissions and no callback function defined', function(){
    expect(util.check_permissions(
      ['a'], // user's permissions
      ['a','b'], // user's permssions
      function (){ return true; },
      undefined
    )).to.eql(false);
  });

})
