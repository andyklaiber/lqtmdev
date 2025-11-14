'use strict'
const _ = require('lodash');
const dayjs = require('dayjs');
const { categoryOrder } = require('../../src/categories');
const { moveRacerInResult, generateResultData } = require('../../src/result_lib');
const { getFees, updateRacePaymentOptions } = require('../../src/fees');
const { processRaceWithSeriesData } = require('../../src/lib/raceProcessing');
const { v4 } = require('uuid');

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
    fastify.get('/', async function (request, reply) {
        let archived = { $ne: true }
        if(request.query.archived){
            archived = {$eq: true};
        }
        
        // Allow overriding the active flag filter via query parameter
        let activeFilter = true;
        if (request.query.showInactive === 'true' || request.query.showInactive === '1') {
            activeFilter = undefined; // Don't filter by active status
        }
        
        // Build date filter based on query parameters
        // Note: eventDate is stored as a string in the database, so we need to use string comparison
        let dateFilter = {};
        
        // If startDate and endDate are provided, use them for range filtering
        if (request.query.startDate && request.query.endDate) {
            dateFilter = {
                $gte: dayjs(request.query.startDate).format('YYYY-MM-DDTHH:mm'),
                $lte: dayjs(request.query.endDate).format('YYYY-MM-DDTHH:mm')
            };
        } 
        // If only startDate is provided, get events after that date
        else if (request.query.startDate) {
            dateFilter = { $gte: dayjs(request.query.startDate).format('YYYY-MM-DDTHH:mm') };
        }
        // If only endDate is provided, get events before that date
        else if (request.query.endDate) {
            dateFilter = { $lte: dayjs(request.query.endDate).format('YYYY-MM-DDTHH:mm') };
        }
        // Default: filter out events that happened more than a day ago
        else {
            const oneDayAgo = dayjs().subtract(1, 'day').format('YYYY-MM-DDTHH:mm');
            dateFilter = { $gte: oneDayAgo };
            fastify.log.info({ oneDayAgo, dateFilter }, 'Default date filter applied');
        }
        
        // Build match criteria
        const matchCriteria = {
            archived,
            eventDate: dateFilter
        };
        
        // Only add active filter if it's defined
        if (activeFilter !== undefined) {
            matchCriteria.active = activeFilter;
        }
        
        // Use aggregation pipeline to join series data
        const pipeline = [
            {
                $match: matchCriteria
            },
            {
                $lookup: {
                    from: 'series',
                    localField: 'series',
                    foreignField: 'seriesId',
                    as: 'seriesData'
                }
            },
            {
                $project: {
                    cashPaymentsEnabled: 1,
                    contactEmail: 1,
                    couponsEnabled: 1,
                    displayName: 1,
                    disableSeriesRedirect: 1,
                    eventDate: 1,
                    eventDetails: 1,
                    entryCountMax: 1,
                    facebookShare: 1,
                    formattedStartDate: 1,
                    headerContent: 1,
                    isTestData: 1,
                    paymentOptions: 1,
                    raceid: 1,
                    regCategories: 1,
                    series: 1,
                    seriesRaceNumber: 1,
                    showPaytypeOnRoster: 1,
                    seriesData: 1
                }
            },
            {
                $sort: { eventDate: 1 }
            }
        ];

        const results = await this.mongo.db.collection('races').aggregate(pipeline).toArray();
        fastify.log.info({ count: results.length, sampleDates: results.slice(0, 3).map(r => ({ raceid: r.raceid, eventDate: r.eventDate, displayName: r.displayName })) }, 'Races found');
        
        // Process series data into paymentOptions
        const processedResults = results.map(race => processRaceWithSeriesData(race, fastify.log));
        
        return processedResults;
    })
    fastify.get('/:id', async function (request, reply) {
        const pipeline = [
            {
                $match: {
                    'raceid': request.params.id
                }
            },
            {
                '$limit': 1
            },
            {
                '$addFields': {
                    'entryCount': {
                        '$size': '$registeredRacers'
                    }
                }
            },
            {
                $lookup: {
                    from: 'series',
                    localField: 'series',
                    foreignField: 'seriesId',
                    as: 'seriesData'
                }
            }
        ];
        if(!request.session.authenticated){
            pipeline.push({
                $project: {
                    archived: 1,
                    cashPaymentsEnabled: 1,
                    contactEmail: 1,
                    couponsEnabled: 1,
                    displayName: 1,
                    disableAge: 1,
                    disableSeriesRedirect: 1,
                    entryCount: 1,
                    entryCountMax: 1,
                    eventDate: 1,
                    eventDetails: 1,
                    facebookShare: 1,
                    formattedStartDate: 1,
                    headerContent:1,
                    isTestData: 1,
                    optionalPurchases: 1,
                    paymentOptions: 1,
                    raceid: 1,
                    regCategories: 1,
                    series: 1,
                    seriesDisableRedirect: 1,
                    seriesRaceNumber: 1,
                    showPaytypeOnRoster: 1,
                    waiver: 1,
                    seriesData: 1
                }
            })
        }
        const result = await this.mongo.db.collection('races').aggregate(pipeline).toArray();

        if (result && result.length > 0) {
            if (result.length === 1) {
                let raceData = result[0];
                
                // Process series data into paymentOptions
                raceData = processRaceWithSeriesData(raceData, fastify.log);
                
                // Apply fee calculations
                raceData.paymentOptions = updateRacePaymentOptions(raceData.paymentOptions);
                return raceData;
            } else {
                return
            }
        } else {
            return fastify.httpErrors.notFound();
        }
    })
    fastify.route({
        method: 'PATCH',
        url: '/temp/:id',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {

            // const race = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, {
                
            //     projection: {
            //         raceid: 1,
            //         regCategories: 1,
            //         registeredRacers: 1,
            //     }
            // });
            // let renamedCategories = {};
            

            // _.forEach(race.registeredRacers, (racerData) => {
            //     if(!_.find(race.regCategories, { 'id': racerData.category })){
            //         renamedCategories[racerData.category] = 1;
            //     }
            // });
            // return { renamedCategories: renamedCategories, catIds : _.map(race.regCategories, 'id') };
            // let temp =  {
            //         "black_bear_men": "black_bear_men_minus__road",
            //         "grizzly_men": "grizzly_men_minus__gravel",
            //         "bear_cub_women": "bear_cub_women_minus__road",
            //         "brown_bear_men": "brown_bear_men_minus__gravel",
            //         "grizzly_women": "grizzly_women_minus__gravel",
            //         "black_bear_women": "black_bear_women_minus__road",
            //         "brown_bear_women": "brown_bear_women_minus__gravel"
            //     };
               
            //        // "bear_cub_men_minus__road",

            // for (let [key, value] of Object.entries(temp)) {

            // let   updateResult = await this.mongo.db.collection('races').updateOne({
            //         'raceid': request.params.id
            //         },
            //         { $set: {"registeredRacers.$[element].category": value} },
            //         { arrayFilters: [ { "element.category": key } ] }
            //     )
            // }  
        }
    })
    fastify.route({
        method: 'PATCH',
        url: '/:id',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            const projection = {
                archived: 1,
                cashPaymentsEnabled: 1,
                contactEmail: 1,
                couponsEnabled: 1,
                couponCodes: 1,
                displayName: 1,
                disableAge: 1,
                disableSeriesRedirect: 1,
                entryCountMax: 1,
                eventDate: 1,
                eventDetails: 1,
                emailTemplate:1,
                formattedStartDate: 1,
                headerContent:1,
                isTestData: 1,
                optionalPurchases: 1,
                paymentOptions: 1,
                raceid: 1,
                regCategories: 1,
                series: 1,
                seriesDisableRedirect: 1,
                seriesRaceNumber: 1,
                showPaytypeOnRoster: 1,
                stripeMeta: 1,
                waiver: 1,
            };
            const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, { projection });
            if (result) {
                let updateKeys = _.pull(Object.keys(projection), ['raceid'])

                let updateObject = _.pick(request.body, updateKeys)
                delete updateObject.registeredRacers;
                
                // Filter out inherited series categories from regCategories
                // Only store race-specific categories and race overrides
                if (updateObject.regCategories && result.series) {
                    // Fetch series data to get series category IDs
                    const seriesData = await this.mongo.db.collection('series').findOne(
                        { 'seriesId': result.series },
                        { projection: { regCategories: 1 } }
                    );
                    
                    if (seriesData && seriesData.regCategories) {
                        const seriesCategoryIds = new Set(seriesData.regCategories.map(cat => cat.id));
                        
                        // Filter categories: keep race-specific and race overrides, exclude pure series categories
                        updateObject.regCategories = updateObject.regCategories.filter(cat => {
                            // Keep if it's NOT a series category (race-specific)
                            // OR if it IS a series category but marked as override
                            const isSeriesCategory = seriesCategoryIds.has(cat.id);
                            const isRaceOverride = cat._isRaceOverride === true;
                            
                            // Keep race-specific categories (not in series at all)
                            if (!isSeriesCategory) {
                                return true;
                            }
                            
                            // Keep race overrides (in series but explicitly overridden)
                            if (isRaceOverride) {
                                return true;
                            }
                            
                            // Filter out pure series categories
                            return false;
                        });
                        
                        fastify.log.info({
                            raceid: result.raceid,
                            series: result.series,
                            totalCategories: request.body.regCategories?.length || 0,
                            savedCategories: updateObject.regCategories.length,
                            filtered: (request.body.regCategories?.length || 0) - updateObject.regCategories.length
                        }, 'Filtered series categories from race update');
                    }
                }
                
                let op = await this.mongo.db.collection('races').updateOne({ '_id': new this.mongo.ObjectId(result._id) }, { $set: updateObject });
                return { op, updateObject };
            } else {
                return fastify.httpErrors.notFound();
            }
        }
    })
    //clone a series race - include series registrations
    fastify.route({
        method: 'POST',
        url: '/series/clone/:raceid/',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.params.raceid) {
                return fastify.httpErrors.badRequest('You must provide a source race ID');
            }
            const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.raceid })
            if (!result) {
                return fastify.httpErrors.notFound();
            }


            delete result['_id'];
            const new_id = request.query.new_race_id;
            if (_.isString(new_id) && new_id.length > 4) {
                result.raceid = new_id;
            } else {
                result.raceid = v4();
            }
            let seriesRegs = _.filter(result.registeredRacers, { paytype: "season" });
            let out = _.map(seriesRegs, (racerData) => {
                racerData.raceid = result.raceid
                return racerData;
            })
            
            return await this.mongo.db.collection('races').insertOne({ ...result, registeredRacers: out });

            //return fastify.httpErrors.notFound();
        }
    })
    // clone any single race
    fastify.route({
        method: 'POST',
        url: '/clone/:raceid',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.params.raceid) {
                return fastify.httpErrors.badRequest('You must provide a source race ID');
            }
            const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.raceid })
            if (!result) {
                return fastify.httpErrors.notFound('Could not find existing race with id: ' + request.params.raceid);
            }
            const newRace = { ...result, ...request.body };
            delete newRace['_id'];
            delete newRace.registeredRacers;
            const new_id = request.query.new_race_id || request.body.raceid;
            if (_.isString(new_id) && new_id.length > 4) {
                newRace.raceid = new_id;
            } else {
                newRace.raceid = v4();
            }
            return await this.mongo.db.collection('races').insertOne({ ...newRace, registeredRacers: [] });
            //return fastify.httpErrors.notFound();
        }
    })
    fastify.get('/roster/:id', async function (request, reply) {
        const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, {
            projection: {
                "registeredRacers.first_name": 1,
                "registeredRacers.last_name": 1,
                "registeredRacers.sponsor": 1,
                "registeredRacers.category": 1,
                "registeredRacers.paytype": 1,
                displayName: 1,
                eventDetails: 1,
                racename: 1,
                formattedStartDate: 1,
                eventDate: 1,
                paymentOptions: 1,
                series: 1,
                showPaytypeOnRoster: 1,
                regCategories: 1,
                raceid: 1
            }
        });

        if (result) {
            const sorted = result.registeredRacers.sort(sortByLast);
            _.forEach(sorted, (el, idx) => {
                sorted[idx].first_name = _.capitalize(el.first_name)
                sorted[idx].last_name = _.capitalize(el.last_name)
            })
            return { ...result, count: sorted.length, registeredRacers: sorted }
        } else {
            return fastify.httpErrors.notFound();
        }
    })

    fastify.get('/results/:id', async function (request, reply) {
        const projection = {
            categories: 1,
            formattedStartDate: 1
        };
        const result = await this.mongo.db.collection('race_results').findOne({ raceid: request.params.id }, { projection });
        if (result && !result.formattedStartDate) {
            const raceMeta = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, { projection: { formattedStartDate: 1 } });
            result.raceMeta = raceMeta;
        }
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    });
}
