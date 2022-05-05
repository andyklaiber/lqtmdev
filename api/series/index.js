'use strict'
const {categoryOrder} = require('../../src/categories');
const { generateSeriesResults } = require('../../src/result_lib')

module.exports = async function (fastify, opts) {
    fastify.get('/results/:id', async function (request, reply) {
        const result = await this.mongo.db.collection('series_results').findOne({series:request.params.id});
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
      });
    fastify.post('/:series_id/generate', async function (request, reply) {
        if(request.query.token !== process.env.UPLOAD_TOKEN){
            throw fastify.httpErrors.unauthorized();
        } else {
            const series = request.params.series_id
            console.log(series)
            const result = await this.mongo.db.collection('race_results').find({series}).toArray();
            const raceMeta = await this.mongo.db.collection('races').find({series}).toArray();
            const racersMeta = await this.mongo.db.collection('racers').find().toArray();

            if (!raceMeta.length) {
                return fastify.httpErrors.notFound();
            }
            const seriesResults = generateSeriesResults(result, raceMeta, racersMeta, categoryOrder);
            this.mongo.db.collection("series_results")
                 .updateOne({ 'series': seriesResults.series }, { $set: seriesResults }, {upsert: true});
            return seriesResults
        }
    })
}