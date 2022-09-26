const _ = require('lodash');
const fp = require('fastify-plugin')


// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

module.exports = fp(async function (fastify, opts) {
    fastify.decorate('verifyAdminSession', verifyAdminSession)
    fastify.decorate('verifyUserAndPassword', verifyUserAndPassword)

    function verifyAdminSession (request, reply, done) {
        if(request.session.authenticated){
            return done();
        }
        return done(new Error('Not authenticated'));
    }

    function verifyUserAndPassword (request, reply, done) {
        if (!request.body || !request.body.user) {
          return done(new Error('Missing user in request body'))
        }
    
        // level.get(request.body.user, onUser)
    
        function onUser (err, password) {
          if (err) {
            if (err.notFound) {
              return done(new Error('Password not valid'))
            }
            return done(err)
          }
    
          if (!password || password !== request.body.password) {
            return done(new Error('Password not valid'))
          }
    
          done()
        }
      }
})