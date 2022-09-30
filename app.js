'use strict'

const path = require('path')
const AutoLoad = require('@fastify/autoload')
const { url } = require('./src/db.config');


const mongoose = require('mongoose')

// Connect to DB
mongoose.connect(url)
    .then(() => console.log(`MongoDB connected`))
    .catch(err => console.log(err))

module.exports = async function (fastify, opts) {
    // fastify.register(require('fastify-websocket'));
    // fastify.register(require("fastify-sentry"))
    fastify.register(require('@fastify/auth'));
    fastify.register(require('@fastify/static'), {
        root: path.join(__dirname, 'public'),
        prefix: '/', // optional: default '/'
    })
    fastify.register(require('@fastify/cors'), {
        origin: true,
        credentials: true
    })
    fastify.register(require('@fastify/mongodb'), {
        // force to close the mongodb connection when app stopped
        // the default value is false
        forceClose: true,

        url
    });
    fastify.register(require('@fastify/secure-session'), {
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
    fastify.register(AutoLoad, {
        dir: path.join(__dirname, 'plugins'),
        options: Object.assign({}, opts)
    })

    // This loads all plugins defined in routes
    // define your routes in one of these
    fastify.register(AutoLoad, {
        dir: path.join(__dirname, 'api'),
        options: Object.assign({}, opts),
        dirNameRoutePrefix: function rewrite(folderParent, folderName) {
            console.log(`${folderName}`)
            return `api/${folderName}`;
        }
    })

    // fastify.get('/live/', { websocket: true }, (connection /* SocketStream */, req /* FastifyRequest */) => {

    //     connection.socket.on('connect', message => {
    //         // message.toString() === 'hi from client'
    //         connection.socket.send('hi from server')
    //     })
    // })

    fastify.get('/public/index.html', async function (request, reply) {
        reply.redirect('/')
    })
}
