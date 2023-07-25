'use strict'
const _ = require('lodash');
const { categoryOrder } = require('../../src/categories');
const { moveRacerInResult, generateResultData } = require('../../src/result_lib');
const { getFees, updateRacePaymentOptions } = require('../../src/fees');
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
    fastify.get('/', async function (request, reply) {
        const cursor = this.mongo.db.collection('races').find({ active: true, archived: { $ne: true } }, {
            projection: {
                cashPaymentsEnabled: 1,
                contactEmail: 1,
                couponsEnabled: 1,
                displayName: 1,
                eventDate: 1,
                eventDetails: 1,
                entryCountMax: 1,
                facebookShare: 1,
                formattedStartDate: 1,
                headerContent:1,
                isTestData: 1,
                paymentOptions: 1,
                raceid: 1,
                regCategories: 1,
                series: 1,
                seriesRaceNumber: 1,
                showPaytypeOnRoster: 1,
            }
        }).sort({ eventStart: 1 })

        return await cursor.toArray();
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
                $project: {
                    archived: 1,
                    cashPaymentsEnabled: 1,
                    contactEmail: 1,
                    couponsEnabled: 1,
                    displayName: 1,
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
                    seriesRaceNumber: 1,
                    showPaytypeOnRoster: 1,
                    stripeMeta: 1,
                    waiver: 1,
                }
            }
        ];
        const result = await this.mongo.db.collection('races').aggregate(pipeline).toArray();

        if (result && result.length > 0) {
            if (result.length === 1) {
                const raceData = result[0]
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
                seriesRaceNumber: 1,
                showPaytypeOnRoster: 1,
                stripeMeta: 1,
            };
            const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, { projection });
            if (result) {
                let updateKeys = _.pull(Object.keys(projection), ['raceid'])

                let updateObject = _.pick(request.body, updateKeys)
                delete updateObject.registeredRacers;
                let op = await this.mongo.db.collection('races').updateOne({ '_id': this.mongo.ObjectId(result._id) }, { $set: updateObject });
                return { op, updateObject };
            } else {
                return fastify.httpErrors.notFound();
            }
        }
    })
    //clone a race - include series registrations
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


