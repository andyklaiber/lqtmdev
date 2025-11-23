'use strict'

// Read the .env file.
require('dotenv').config()

// Require the framework
const Fastify = require('fastify')

// Require library to exit fastify process, gracefully (if possible)
const closeWithGrace = require('close-with-grace')

// Instantiate Fastify with some config
const app = Fastify({
  logger: true
})

// Register your application as a normal plugin.
const appService = require('./app.js')
app.register(appService)

// delay is the number of milliseconds for the graceful close to finish
// Increased default to 10s to allow in-flight requests to complete during deployments
const closeListeners = closeWithGrace({ delay: process.env.FASTIFY_CLOSE_GRACE_DELAY || 10000 }, async function ({ signal, err, manual }) {
  if (err) {
    app.log.error(err)
  }
  app.log.info('Gracefully closing application...')
  await app.close()
  app.log.info('Application closed successfully')
})

app.addHook('onClose', async (instance, done) => {
  closeListeners.uninstall()
  done()
})

// Start listening.
app.listen({ port: process.env.PORT || 3000, host:'0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
