'use strict'
const fs = require('fs');
const path = require('path');
const {categoryOrder,generateCategoryData} = require('../../src/categories');
const {generateResultData} = require('../../src/result_lib')

module.exports = async function (fastify, opts) {
  fastify.post('/', async function (request, reply) {
    if(request.query.token !== process.env.UPLOAD_TOKEN){
        throw fastify.httpErrors.unauthorized();
    } else {
        let raceMeta = request.body.data.race;

        this.mongo.db.collection("races")
        .updateOne({ 'raceid': raceMeta.raceid }, { $set: raceMeta }, {upsert: true});

        let results = request.body.data.RESULTS;


        this.mongo.db.collection("liveresults")
        .updateOne({ 'race.raceid': raceMeta.raceid }, { $set: request.body.data }, {upsert: true});

        const out = generateResultData(results, categoryOrder);
     
        this.mongo.db.collection("race_results")
        .updateOne({ 'raceid': raceMeta.raceid }, { $set: out }, {upsert: true});
        
        generateCategoryData(out);
        return out;
    }
  })
}
