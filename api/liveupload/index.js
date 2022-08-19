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
    fastify.post('/:raceNumber', async function (request, reply) {
        if (request.query.token !== process.env.UPLOAD_TOKEN) {
            throw fastify.httpErrors.unauthorized();
        } else {
            let raceMeta = request.body.data.race;
            let final = await this.mongo.db.collection("race_results")
                .find({ 'raceid': raceMeta.raceid, 'final': true }).toArray();
            request.log.info('RaceID', raceMeta.raceid)
            if (final.length) {
                return fastify.httpErrors.conflict();
            }

            if (request.params.raceNumber && parseInt(request.params.raceNumber)) {
                let existingRace = await this.mongo.db.collection("races").findOne({ seriesRaceNumber: request.params.raceNumber })

                if(existingRace){
                    request.log.info("found existing race record")
                    await this.mongo.db.collection("races")
                    .updateOne({ '_id': existingRace._id }, { $set: raceMeta }, { upsert: true });
                }
                else{
                    request.log.info("creating new race record")
                    raceMeta.displayName = `Race ${request.params.raceNumber}`
                    let startDate = new Date();
                    raceMeta.formattedStartDate = `${startDate.getMonth()}/${startDate.getDate()}`;
                    raceMeta.series = "pcrs_2022"
                    raceMeta.seriesRaceNumber = request.params.raceNumber
                    raceMeta.active = true;
                    await this.mongo.db.collection("races")
                        .updateOne({ 'seriesRaceNumber': request.params.raceNumber }, { $set: raceMeta }, { upsert: true });
                }

                let results = request.body.data.RESULTS;


                this.mongo.db.collection("liveresults")
                    .updateOne({ 'race.raceid': raceMeta.raceid }, { $set: request.body.data }, { upsert: true });

                const out = generateResultData(results, categoryOrder);
                out.series='pcrs_2022';
                request.log.info("updating results data")
                this.mongo.db.collection("race_results")
                    .updateOne({ 'raceid': raceMeta.raceid }, { $set: out }, { upsert: true });

                const catdata = generateCategoryData(out);
                catdata.forEach(catObject => {
                    this.mongo.db.collection("categories").updateOne({ 'identifier': catObject.identifier }, { $set: catObject }, { upsert: true });
                });
                return out;
            }
            else {
                return fastify.httpErrors.badRequest();
            }
        }
    })
}
