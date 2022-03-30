'use strict'
const categories = require('../../src/categories');

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    
    let cat_insert = {};
    console.dir(categories);
    categories.forEach(()=>{})


    return null;
  })
}
