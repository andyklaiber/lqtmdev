'use strict'
const {categoryOrder} = require('../../src/categories');
const { generateSeriesResults,getAttendance } = require('../../src/result_lib');
const { stringify } = require('csv/sync');
const _ = require('lodash');
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
            return reply.header('Content-disposition', `attachment; filename=${request.params.id}.tsv`).type('text/tsv').send(resString);;
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
      // get the active series races
      fastify.get('/:id/registration', async function (request, reply) {
        const result = await this.mongo.db.collection('races').find({series:request.params.id, active:true}, {
            projection:{
                racename:1,
                displayName:1,
                eventDate:1,
                raceid:1,
            }
        }).sort({eventDate: 1}).toArray();
        if (result) {


            return result;
        } else {
            return fastify.httpErrors.notFound('Could not find active races for series');
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
    //   fastify.get('/:id/emails', async function (request, reply) {
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
    //     }}).toArray();

    //     let emails = []
    //     result.forEach((seriesRace)=>{
    //         seriesRace.registeredRacers.forEach((racer)=>{
    //             if(racer.email && emails.indexOf(racer.email) < 0){
    //                 emails.push(racer.email)
    //             }
    //         })
    //     })
    //     if (result) {
    //         return emails.sort().join(", ");
    //     } else {
    //         return fastify.httpErrors.notFound();
    //     }
    
    //   })
      fastify.route({
        method: 'GET',
        url: '/:id/export-contact',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
          if (!request.params.id) {
            return fastify.httpErrors.badRequest('You must provide a race ID');
          }
    
          const result = await this.mongo.db.collection('races').find({ 'series': request.params.id }, {
            projection: {
              "regCategories": 1, "registeredRacers": 1, 'eventDate': 1, 'eventDetails.name': 1
            }
          }).toArray();
            if (result) {
                let out = [];
                console.log(result.eventDate)
                result.forEach((seriesRace) => {
                    seriesRace.registeredRacers.forEach((racerObj) => {
                        let cat = _.find(seriesRace.regCategories, { id: racerObj.category })
                        if (!out.find((existing) => { return existing.email === racerObj.email }))
                            out.push(_.assign(racerObj, { category: cat?.catdispname }));
                    })
                })
            const columns = [
              { 'key': 'last_name', 'header': 'Last' },
              { 'key': 'first_name', 'header': 'First', },
              { 'key': 'email', 'header': 'Email' },
              { 'key': 'category', 'header': 'Category', }
            ]
            let csvData = stringify(_.sortBy(out, ['last_name']), { columns, header: true });
            // return _.sortBy(out, ['category','last_name'])
            return reply.header('Content-disposition', `attachment; filename=${request.params.id}.csv`).type('text/csv').send(csvData);
          } else {
            return fastify.httpErrors.notFound();
          }
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