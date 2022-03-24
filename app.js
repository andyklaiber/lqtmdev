'use strict'
require('newrelic');
const path = require('path')
const AutoLoad = require('fastify-autoload')

module.exports = async function (fastify, opts) {
    fastify.register(require('fastify-static'), {
        root: path.join(__dirname, 'public'),
        prefix: '/public/', // optional: default '/'
    })
    fastify.register(require('fastify-cors'), { 
        origin:true
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
        dir: path.join(__dirname, 'routes'),
        options: Object.assign({}, opts)
    })


}
