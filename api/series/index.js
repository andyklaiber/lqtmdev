'use strict'
const {categoryOrder} = require('../../src/categories');
const { generateSeriesResults,getAttendance } = require('../../src/result_lib');
const dayjs = require('dayjs');

module.exports = async function (fastify, opts) {
    
    fastify.get('/results/:id', async function (request, reply) {
        const result = await this.mongo.db.collection('series_results').findOne({series:request.params.id});
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
      });
      fastify.get('/results/:id/attendance', async function (request, reply) {
        const result = await this.mongo.db.collection('series_results').findOne({series:request.params.id});
        if (result) {
            let resArry = getAttendance(result);
            let resString = '';
            resArry.forEach((val)=>{
                resString += `${val.last}\t${val.first}\t${val.count}\n`
            })
            return resString;
        } else {
            return fastify.httpErrors.notFound();
        }
      });
      fastify.get('/:id/races', async function (request, reply) {
        const result = await this.mongo.db.collection('series_results').findOne({series:request.params.id});
        if (result) {
            const races = await this.mongo.db.collection('races').find({
                active:true, 
                series:request.params.id
            }, {
                projection:{
                    racename:1,
                    formattedStartDate:1,
                displayName: 1,
                eventDetails: 1,
                eventDate: 1,
                paymentOptions: 1,
                series: 1,
                regCategories: 1,
                raceid:1
            }}).sort({eventStart:1}).toArray()
            result.races = races;
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    
      })
      fastify.get('/:id', async function (request, reply) {
        const result = await this.mongo.db.collection('series').findOne({series:request.params.id});
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    
      })
    //   fastify.get('/:id/roster', async function (request, reply) {
    //     const result = await this.mongo.db.collection('races').find({series:request.params.id}, {
    //         projection:{
    //         racename:1,
    //         formattedStartDate:1,
    //         displayName: 1,
    //         eventDetails: 1,
    //         eventDate: 1,
    //         paymentOptions: 1,
    //         series: 1,
    //         regCategories: 1,
    //         raceid:1,
    //         registeredRacers:1
    //     }});

    //     const now = new dayjs();
    //     //{createdAt:{$gte:ISODate("2021-01-01"),$lt:ISODate("2020-05-01"}}
    //     if (result) {
    //         return result.toArray();
    //     } else {
    //         return fastify.httpErrors.notFound();
    //     }
    
    //   })
    fastify.post('/:series_id/generate', async function (request, reply) {
        if(request.query.token !== process.env.UPLOAD_TOKEN){
            throw fastify.httpErrors.unauthorized();
        } else {
            const series = request.params.series_id
            console.log(series)
            const result = await this.mongo.db.collection('race_results').find({series}).toArray();
            const raceMeta = await this.mongo.db.collection('races').find({series}).toArray();
            const racersMeta = await this.mongo.db.collection('racers').find().toArray();
            const teamCompTeams = await this.mongo.db.collection('team_comp').find().toArray();

            if (!raceMeta.length) {
                return fastify.httpErrors.notFound();
            }
            let seriesId = series;
            if(request.query.test){
                seriesId = seriesId + '_test';
            }
            const { seriesResults, teamPoints } = generateSeriesResults(result, raceMeta, racersMeta, categoryOrder, teamCompTeams);
            this.mongo.db.collection("series_results")
                 .updateOne({ 'series': seriesId }, { $set: seriesResults }, {upsert: true});
            teamPoints.forEach(async (teamRacer, idx)=>{
                    await this.mongo.db.collection('team_comp').updateOne({ 'Name': teamRacer.Name }, { $set: teamRacer }, { upsert: true });
            })
            return { seriesResults, teamPoints }
        }
    })
    fastify.post('/:series_id/categories', async function (request, reply) {
        if(request.query.token !== process.env.UPLOAD_TOKEN){
            throw fastify.httpErrors.unauthorized();
        } else {
            const series = request.params.series_id
            console.log(series)
            const result = await this.mongo.db.collection('series_results').findOne({series});
            if (!result) {
                return fastify.httpErrors.notFound();
            }
            console.log(request.body);
            
            await this.mongo.db.collection("series_results").updateOne({ series }, { $set: {"regCategories": request.body} }, {upsert: true});
           
            return request.body;
        }
    })
}