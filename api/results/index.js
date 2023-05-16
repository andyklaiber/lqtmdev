'use strict'
const _ = require('lodash');
const { categoryOrder } = require('../../src/categories');
const { moveRacerInResult, generateResultData, generateSeriesResults, generatePCRSSeriesResults } = require('../../src/result_lib');
const { v4: uuidv4 } = require('uuid');

const sortByLast = (a, b) => {
    const nameA = a.last_name.toUpperCase(); // ignore upper and lowercase
    const nameB = b.last_name.toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
        return -1;
    }
    if (nameA > nameB) {
        return 1;
    }
    // names must be equal
    return 0;
}

module.exports = async function (fastify, opts) {
   
    fastify.route({
        method: 'PATCH',
        url: '/:id',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            const resultRecord = {
                eventName: request.body.eventName,
                shortName: request.body.shortName,
                formattedStartDate: request.body.formattedStartDate,
                series: request.body.series,
                showMillis: request.body.showMillis,
                final: request.body.final,
                // authToken: uuidv4(),
            };
            // const getUploadUrl = function(authToken){
            //     return `${process.env.DOMAIN}/api/race/${request.params.id}/token/${authToken}`
            // }
            let op = this.mongo.db.collection("race_results")
                    .updateOne({ _id: this.mongo.ObjectId(request.params.id)}, { $set: resultRecord }, { upsert: true });
           
                // let op = await this.mongo.db.collection('races').updateOne({ '_id': this.mongo.ObjectId(result._id) }, { $set: updateObject });
            return {op}
        
        }
    })
    // fastify.route({
    //     method: 'GET',
    //     url: 'results/:id/upload-url',
    //     preHandler: fastify.auth([fastify.verifyAdminSession]),
    //     handler: async function (request, reply) {
    //         const projection = {
    //             archived: 1,
    //             resultsAuthToken: 1
    //         };
    //         const getUploadUrl = function(authToken){
    //             return `${process.env.DOMAIN}/api/race/${request.params.id}/token/${authToken}`
    //         }
    //         const result = await this.mongo.db.collection('race_results').findOne({ 'raceid': request.params.id }, { projection });
    //         if (result) {
    //             if(result.resultsAuthToken){
    //                 return {resultsAuthToken: result.resultsAuthToken, url: getUploadUrl(result.resultsAuthToken)}
    //             }
    //         }
    //             return fastify.httpErrors.notFound();     
    //     }
    // })
    fastify.route({
        method: 'POST',
        url: '/genresults/:raceid',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (request.query.token !== process.env.UPLOAD_TOKEN) {
                throw fastify.httpErrors.unauthorized();
            }
            const result = await this.mongo.db.collection('liveresults').findOne({ 'race.raceid': request.params.raceid });
            if (result) {
                // return result;
                const out = generateResultData(result.RESULTS, categoryOrder);

                await this.mongo.db.collection("race_results")
                    .updateOne({ 'raceid': result.race.raceid }, { $set: out }, { upsert: true });
                return out;
            } else {
                return fastify.httpErrors.notFound();
            }
        }
    });

    fastify.get('/', async function (request, reply) {
        // const projection = {
        //     categories: 1,
        //     final:1,
        //     formattedStartDate: 1,
        //     displayName:1,
        //     raceid:1,
        //     series:1
        // };
        let result;
        if(request.query.series){
            result = await this.mongo.db.collection('race_results').find({series:request.query.series}).toArray();
        }else{
            result = await this.mongo.db.collection('race_results').find().toArray();
        }
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    });
   

    fastify.get('/:raceid', async function (request, reply) {
        const projection = {
            _id:1,
            raceid:1,
            categories: 1,
            formattedStartDate: 1,
            shortName:1,
            eventName:1,
            series:1,
            showMillis:1,
            final:1
        };
        const result = await this.mongo.db.collection('race_results').findOne({ raceid: request.params.raceid }, {projection});
        if(result && !result.formattedStartDate){
            const raceMeta = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.raceid }, { projection: { formattedStartDate: 1 } });
            if(raceMeta){
                result.formattedStartDate = raceMeta.formattedStartDate;
            }
        }
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    });
    fastify.route({
        method: 'POST',
        url: '/moveracer', // move racer into a different category, resetting rankings in the destination category
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            const result = await this.mongo.db.collection('race_results').findOne({ raceid: request.query.raceid });
            if (result) {

                const racer = request.body.racername;
                const newCategory = request.body.newCategory


                const modifiedResult = moveRacerInResult(result, racer, newCategory);

                return this.mongo.db.collection("race_results")
                    .updateOne({ 'raceid': request.query.raceid }, { $set: { categories: modifiedResult.categories } }, { upsert: true });
            } else {
                return fastify.httpErrors.notFound();
            }
        }
    });
    fastify.post('/load_sponsors/', async function (request, reply) {
        if (request.query.token !== process.env.UPLOAD_TOKEN) {
            throw fastify.httpErrors.unauthorized();
        }
        const srcRace = await this.mongo.db.collection('race_results').findOne({ raceid: request.query.srcid });
        if (!srcRace) {
            return fastify.httpErrors.notFound();
        } else {
            let updated = {};
            Object.keys(srcRace.categories).forEach((catId) => {
                let category = srcRace.categories[catId];
                if (!category) {
                    console.log(`not category resultable? ${catId}`);
                    return;
                }
                category.results.forEach(async (resultData) => {
                    let racer = {
                        Name: resultData.Name
                    }
                    if (resultData.Sponsor && resultData.Sponsor.length > 0) {
                        racer.Sponsor = resultData.Sponsor;
                        updated[racer.Name] = racer.Sponsor;
                    }
                    await mongo.db.collection('racers').updateOne({ 'Name': racer.Name }, { $set: racer }, { upsert: true });
                })
            })
            return updated;
        }
    });

    fastify.post('/sync_sponsors/', async function (request, reply) {
        if (request.query.token !== process.env.UPLOAD_TOKEN) {
            throw fastify.httpErrors.unauthorized();
        }
        console.log(request.query.destid)
        const racersCursor = await this.mongo.db.collection('racers').find();
        const destRace = await this.mongo.db.collection('race_results').findOne({ raceid: request.query.destid });
        if (!destRace) {
            return fastify.httpErrors.notFound();
        } else {
            let racersArray = await racersCursor.toArray();
            let changes = {};
            Object.keys(destRace.categories).forEach((catId) => {
                let category = destRace.categories[catId];
                if (!category) {
                    console.log(`not category resultable? ${catId}`);
                    return;
                }
                category.results.forEach(async (resultData, idx) => {
                    // console.log(`${resultData.Name}: ${resultData.Sponsor}: len ${resultData.Sponsor.length}`)
                    if (!resultData.Sponsor || resultData.Sponsor.length === 0) {
                        console.log(`racer without sponsor: ${resultData.Name}`)
                        let racer = racersArray.filter((elem) => elem.Name === resultData.Name && elem.Sponsor && elem.Sponsor.length > 0);
                        if (racer.length > 0) {
                            if (racer.length > 1) {
                                console.log("found multiple racer entries")
                                racer.forEach((elem) => {
                                    console.log(elem)
                                })
                            } else {
                                _.set(destRace, `${catId}.results[${idx}].Sponsor`, racer[0].Sponsor)
                                _.set(changes, `${catId}.results[${idx}].Sponsor`, racer[0].Sponsor)
                                _.set(changes, `${catId}.results[${idx}].Name`, racer[0].Name)
                            }
                        }
                        else {
                            console.log(`no maching racer sponsor entry: ${resultData.Name}`)
                        }
                    }

                })
            })
            this.mongo.db.collection("race_results")
                .updateOne({ 'raceid': destRace.raceid }, { $set: { categories: destRace.categories } }, { upsert: true });
            return reply.send({ changes });
        }
    })
    fastify.get('/series/', async function (request, reply) {
        // const projection = {
        //     categories: 1,
        //     final:1,
        //     formattedStartDate: 1,
        //     displayName:1,
        //     raceid:1,
        //     series:1
        // };
        const result = await this.mongo.db.collection('series_results').find().toArray();
        return result;
    });
    fastify.get('/series/:id', async function (request, reply) {
        const projection = {
            _id:1,
            eventName:1,
            series:1,
            published:1,
            final:1,
        };
        const result = await this.mongo.db.collection('series_results').findOne({ _id: this.mongo.ObjectId(request.params.id) }, {projection});
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    });
    fastify.route({
        method: 'PATCH',
        url: '/series/:id',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            const resultRecord = {
                eventName: request.body.eventName,
                published: request.body.published,
                final: request.body.final,
                // authToken: uuidv4(),
            };
            // const getUploadUrl = function(authToken){
            //     return `${process.env.DOMAIN}/api/race/${request.params.id}/token/${authToken}`
            // }
            let op = this.mongo.db.collection("series_results")
                    .updateOne({ _id: this.mongo.ObjectId(request.params.id)}, { $set: resultRecord }, { upsert: true });
           
                // let op = await this.mongo.db.collection('races').updateOne({ '_id': this.mongo.ObjectId(result._id) }, { $set: updateObject });
            return {op}
        
        }
    })
    fastify.route({
        method: 'POST',
        url: '/series/:series_id/generate',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            const series = request.params.series_id
            console.log(series)
            const result = await this.mongo.db.collection('race_results').find({series}).toArray();
            const racersMeta = await this.mongo.db.collection('racers').find().toArray();
            const teamCompTeams = await this.mongo.db.collection('team_comp').find({Series:series}).toArray();

            if (!result.length) {
                return fastify.httpErrors.notFound();
            }
            let seriesId = series;
            // if(request.query.test){
            //     seriesId = seriesId + '_test';
            // }
            let seriesResults, teamPoints;
            if(series.indexOf('pcrs')>-1){
                const res = generatePCRSSeriesResults(result, racersMeta, categoryOrder, teamCompTeams);
                seriesResults = res.seriesResults;
                teamPoints = res.teamPoints;
            }else{
                const res = generateSeriesResults(result, racersMeta);
                seriesResults = res.seriesResults;
            }
            this.mongo.db.collection("series_results")
                .updateOne({ 'series': seriesId }, { $set: seriesResults }, {upsert: true});
            // teamPoints.forEach(async (teamRacer, idx)=>{
            //         await this.mongo.db.collection('team_comp').updateOne({ Series: series, 'Name': teamRacer.Name }, { $set: teamRacer }, { upsert: true });
            // })
            return { seriesResults  }
        }
    })

    // fastify.get('/live', async function (request, reply) {


    //     const collection = db.collection('liveresults');
    //     const changeStream = collection.watch([], { fullDocument: 'updateLookup' });
    //     changeStream.on('change', next => {
    //         console.log(next);
    //     });



    //     const result = await this.mongo.db.collection('race_results').findOne({ raceid: request.params.id });
    //     if (result) {
    //         return result;
    //     } else {
    //         return fastify.httpErrors.notFound();
    //     }
    // })
}


