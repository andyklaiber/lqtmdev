'use strict'
const fs = require('fs');
const path = require('path');
const { categoryOrder, generateCategoryData } = require('../../src/categories');
const { generateResultData } = require('../../src/result_lib')

const raceTemplate =
    {
        "_id": {    "$oid": "624e21627235dcaf6fc94f94"  },
        "raceid": "33cjbg1fl288ygop", 
        "eventStart": 1650499830363, 
        "racename": "Prairie City Race Series", 
        "useActualStarts": false, 
        "displayName": "Race 5", 
        "formattedStartDate": "4/20", 
        "series": "pcrs_2022", 
        "active": true 
    }


module.exports = async function (fastify, opts) {
    fastify.post('/', async function (request, reply) {
        if (request.query.auth !== process.env.UPLOAD_TOKEN) {
            throw fastify.httpErrors.unauthorized();
        } else {
            let raceid = request.body.data.race?.raceid;
            if(request.query.raceid){
                raceid = request.query.raceid;
            }
            let raceMeta = request.body.data.race;
            let final = await this.mongo.db.collection("race_results")
                .find({ 'raceid': raceid, 'final': true }).toArray();
            request.log.info('Rhesus RaceID: "'+ raceid+'"')
            if (final.length) {
                return fastify.httpErrors.conflict();
            }

            let results = request.body.data.RESULTS;
            this.mongo.db.collection("liveresults")
                .updateOne({ 'race.raceid': raceid }, { $set: request.body.data }, { upsert: true });

            const out = generateResultData(results, categoryOrder);
            if(request.query.series){
                out.series = request.query.series;
            }
            request.log.info("updating results data for rhesus id: "+raceid)
            this.mongo.db.collection("race_results")
                .updateOne({ 'raceid': raceid }, { $set: out }, { upsert: true });

            return out;
            
        }
    })
}
