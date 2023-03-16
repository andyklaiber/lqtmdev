'use strict'
const path = require('path');
require('dotenv').config({path:path.resolve(process.cwd(), 'test/api/helpers/.env.test')})
const { test } = require('tap')
const fastify = require('fastify');
const appModules = require('../../../app')


test('requests the "/" route', async t => {
  const app = fastify()
  app.register(appModules);
  t.teardown(() => app.close()) 

  const response = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload:{
      email:"goober",
      password:"bar"
    }
  })
  t.equal(response.statusCode, 401, 'returns a status code of 401 with bad creds')
})