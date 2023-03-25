'use strict'

const path = require('path');
const fastifyAutoLoad = require('@fastify/autoload');
const fastifyStatic = require('@fastify/static');
const fastifyCors = require('@fastify/cors');
const fastifyMongoDb = require('@fastify/mongodb');
const fastifySecureSession = require('@fastify/secure-session');
const { url } = require('./src/db.config');
console.log(`DB host: ${process.env.DB_HOST}`);
module.exports = async function (fastify, opts) {
    fastify.register(require('@fastify/auth'));
    
    fastify.register(fastifyStatic, {
        root: path.join(__dirname, 'public'),
        prefix: '/'
    })
    fastify.register(fastifyCors, {
        origin: true,
        credentials: true
    })
    fastify.register(fastifyMongoDb, {
        // force to close the mongodb connection when app stopped
        // the default value is false
        forceClose: true,
        url
    });
    fastify.register(fastifySecureSession, {
        // the name of the session cookie, defaults to 'session'
        cookieName: 'signsessid',
        // adapt this to point to the directory where secret-key is located
        key: Buffer.from(process.env.COOKIE_SECRET, 'hex'),
        cookie: {
            httpOnly: true,
            secure: 'auto',
            path: '/'
            // options for setCookie, see https://github.com/fastify/fastify-cookie
        }
    })

    // This loads all plugins defined in plugins
    // those should be support plugins that are reused
    // through your application
    fastify.register(fastifyAutoLoad, {
        dir: path.join(__dirname, 'plugins'),
        options: Object.assign({}, opts)
    })

    // This loads all plugins defined in routes
    // define your routes in one of these
    fastify.register(fastifyAutoLoad, {
        dir: path.join(__dirname, 'api'),
        options: Object.assign({}, opts),
        dirNameRoutePrefix: function rewrite(folderParent, folderName) {
            console.log(`${folderName}`)
            return `api/${folderName}`;
        }
    })

    fastify.get('/public/index.html', async function (request, reply) {
        reply.redirect('/')
    })
}
