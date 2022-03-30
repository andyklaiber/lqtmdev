'use strict'
require('newrelic');
const path = require('path')
const AutoLoad = require('fastify-autoload')
const { url } = require('./src/db.config');
console.log("mongo URL")
console.log(url);


const mongoose = require('mongoose')

// Connect to DB
mongoose.connect(url)
 .then(() => console.log(`MongoDB connected`))
 .catch(err => console.log(err))

module.exports = async function (fastify, opts) {
    fastify.register(require('fastify-static'), {
        root: path.join(__dirname, 'public'),
        prefix: '/', // optional: default '/'
    })
    fastify.register(require('fastify-cors'), { 
        origin:true
      })
    fastify.register(require('fastify-mongodb'), {
    // force to close the mongodb connection when app stopped
    // the default value is false
    forceClose: true,
    
    url
    });
      
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
        dirNameRoutePrefix: function rewrite (folderParent, folderName) {
            console.log(`${folderName}`)
            return `api/${folderName}`;
        }
    })

    fastify.get('/public/index.html', async function (request, reply) {
        reply.redirect('/')
    })
}
