'use strict'

module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const cursor = this.mongo.db.collection('races').find({active:true}).sort({eventStart:1})

    return await cursor.toArray();
  })
  fastify.get('/results/:id', async function (request, reply) {
    const result = await this.mongo.db.collection('race_results').findOne({raceid:request.params.id});
    if (result) {
        return result;
    } else {
        return fastify.httpErrors.notFound();
    }
  })

  fastify.get('/live', async function (request, reply) {
    
    
    const collection = db.collection('liveresults');
    const changeStream = collection.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', next => {
       console.log(next);
    });
    
    
    
    const result = await this.mongo.db.collection('race_results').findOne({raceid:request.params.id});
    if (result) {
        return result;
    } else {
        return fastify.httpErrors.notFound();
    }
  })
}


