
const _ = require('lodash');

module.exports = async function (fastify, opts) {

    fastify.post('/login', (request, reply) => {
        if(request.session.authenticated){
            return 'already logged in';
        }
        const { email, password } = request.body

        if (password === 'abc123') {
            request.session.authenticated = true;
            return 'logged in';
        } else {
            return fastify.httpErrors.unauthorized('Invalid credentials');
        }
    });



    // add a logout route
    fastify.get('/logout', (request, reply) => {
        if (request.session.authenticated) {
            request.session.authenticated = undefined;
            reply.redirect('/')
        } else {
            reply.redirect('/')
        }
    });
};