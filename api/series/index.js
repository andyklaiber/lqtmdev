'use strict'
const {categoryOrder} = require('../../src/categories');
const { generateSeriesResults,getAttendance } = require('../../src/result_lib');
const { stringify } = require('csv/sync');
const _ = require('lodash');
const dayjs = require('dayjs');

module.exports = async function (fastify, opts) {
    
    // GET all series
    fastify.get('/', async function (request, reply) {
        const query = {};
        
        // Optional filter by active status
        if (request.query.active !== undefined) {
            query.active = request.query.active === 'true';
        }
        
        // Optional filter by year
        if (request.query.year) {
            query.year = parseInt(request.query.year);
        }
        
        const series = await this.mongo.db.collection('series').find(query)
            .sort({ year: -1, seriesId: 1 })
            .toArray();
        
        return series;
    });
    
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
        const result = await this.mongo.db.collection('series').findOne({
            $or: [
                { seriesId: request.params.id },
                { series: request.params.id }
            ]
        });
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

    // PATCH endpoint for updating series properties
    fastify.route({
        method: 'PATCH',
        url: '/:id',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.params.id) {
                return fastify.httpErrors.badRequest('You must provide a series ID');
            }

            const seriesId = request.params.id;
            
            // Check if series exists
            const existingSeries = await this.mongo.db.collection('series').findOne({ 
                $or: [
                    { seriesId: seriesId },
                    { series: seriesId }
                ]
            });

            if (!existingSeries) {
                return fastify.httpErrors.notFound('Series not found');
            }

            // Define allowed fields for update
            const allowedFields = [
                'name',
                'displayName',
                'year',
                'active',
                'description',
                'regCategories',
                'categoryGroups',      // Unified model: categories with their payment options
                'defaultPaymentOptions' // Hybrid model: series-wide default payment options
            ];

            // Build update object with only allowed fields
            const updateData = {};
            for (const field of allowedFields) {
                if (request.body[field] !== undefined) {
                    updateData[field] = request.body[field];
                }
            }

            if (Object.keys(updateData).length === 0) {
                return fastify.httpErrors.badRequest('No valid fields provided for update');
            }

            // Validate categoryGroups structure if provided
            // Unified model: each group has categories and their payment options
            if (updateData.categoryGroups) {
                if (!Array.isArray(updateData.categoryGroups)) {
                    return fastify.httpErrors.badRequest('categoryGroups must be an array');
                }
                
                // Get the regCategories to validate against
                // Use the updated regCategories if provided, otherwise use existing
                const regCategories = updateData.regCategories || existingSeries.regCategories || [];
                const validCategoryIds = new Set(regCategories.map(cat => cat.id));
                
                // Track all categories across groups to check for duplicates
                const allAssignedCategories = new Set();
                
                for (const group of updateData.categoryGroups) {
                    if (!group.name || !group.categories || !Array.isArray(group.categories)) {
                        return fastify.httpErrors.badRequest('Each categoryGroup must have name and categories array');
                    }
                    
                    // Validate paymentOptions if provided
                    if (group.paymentOptions) {
                        if (!Array.isArray(group.paymentOptions)) {
                            return fastify.httpErrors.badRequest('paymentOptions in categoryGroup must be an array');
                        }
                        
                        for (const payOption of group.paymentOptions) {
                            if (!payOption.name || !payOption.type || typeof payOption.amount !== 'number') {
                                return fastify.httpErrors.badRequest('Each payment option must have name, type, and amount');
                            }
                        }
                    }
                    
                    // Validate each category in the group
                    for (const categoryId of group.categories) {
                        // Check if category exists in regCategories
                        if (!validCategoryIds.has(categoryId)) {
                            return fastify.httpErrors.badRequest(`Category "${categoryId}" in group "${group.name}" does not exist in regCategories`);
                        }
                        
                        // Check for duplicate categories across groups
                        if (allAssignedCategories.has(categoryId)) {
                            return fastify.httpErrors.badRequest(`Category "${categoryId}" appears in multiple category groups. Each category can only be in one group.`);
                        }
                        
                        allAssignedCategories.add(categoryId);
                    }
                }
            }

            // If regCategories is being updated and categoryGroups exists, clean up invalid categories
            if (updateData.regCategories && (existingSeries.categoryGroups || updateData.categoryGroups)) {
                const newValidCategoryIds = new Set(updateData.regCategories.map(cat => cat.id));
                const categoryGroups = updateData.categoryGroups || existingSeries.categoryGroups;
                
                if (categoryGroups && Array.isArray(categoryGroups)) {
                    // Remove any categories that no longer exist in regCategories
                    categoryGroups.forEach(group => {
                        group.categories = group.categories.filter(catId => newValidCategoryIds.has(catId));
                    });
                    
                    // Update the categoryGroups in updateData
                    updateData.categoryGroups = categoryGroups;
                    
                    fastify.log.info({ seriesId }, 'Cleaned up categoryGroups after regCategories update');
                }
            }

            // Perform the update
            const result = await this.mongo.db.collection('series').updateOne(
                { 
                    $or: [
                        { seriesId: seriesId },
                        { series: seriesId }
                    ]
                },
                { $set: updateData }
            );

            if (result.modifiedCount === 0 && result.matchedCount === 0) {
                return fastify.httpErrors.internalServerError('Failed to update series');
            }

            // Fetch and return updated series
            const updatedSeries = await this.mongo.db.collection('series').findOne({ 
                $or: [
                    { seriesId: seriesId },
                    { series: seriesId }
                ]
            });

            fastify.log.info({ 
                seriesId, 
                updatedFields: Object.keys(updateData) 
            }, 'Series updated successfully');

            return updatedSeries;
        }
    });

    // POST endpoint for creating a new series
    fastify.route({
        method: 'POST',
        url: '/',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            const requiredFields = ['seriesId', 'name', 'displayName', 'year'];
            
            for (const field of requiredFields) {
                if (!request.body[field]) {
                    return fastify.httpErrors.badRequest(`Missing required field: ${field}`);
                }
            }

            const seriesId = request.body.seriesId;

            // Check if series already exists
            const existingSeries = await this.mongo.db.collection('series').findOne({ 
                $or: [
                    { seriesId: seriesId },
                    { series: seriesId }
                ]
            });

            if (existingSeries) {
                return fastify.httpErrors.conflict('Series with this ID already exists');
            }

            // Build series document
            const seriesData = {
                seriesId: request.body.seriesId,
                series: request.body.seriesId, // Keep both for compatibility
                name: request.body.name,
                displayName: request.body.displayName,
                year: request.body.year,
                active: request.body.active !== undefined ? request.body.active : true,
                description: request.body.description || '',
                regCategories: request.body.regCategories || [],
                categoryGroups: request.body.categoryGroups || [],   // Unified model
                defaultPaymentOptions: request.body.defaultPaymentOptions || [] // Hybrid model
            };
            
            // Validate categoryGroups if provided
            if (request.body.categoryGroups) {
                if (!Array.isArray(request.body.categoryGroups)) {
                    return fastify.httpErrors.badRequest('categoryGroups must be an array');
                }
                
                const validCategoryIds = new Set(seriesData.regCategories.map(cat => cat.id));
                const allAssignedCategories = new Set();
                
                for (const group of request.body.categoryGroups) {
                    if (!group.name || !group.categories || !Array.isArray(group.categories)) {
                        return fastify.httpErrors.badRequest('Each categoryGroup must have name and categories array');
                    }
                    
                    // Validate paymentOptions if provided
                    if (group.paymentOptions) {
                        if (!Array.isArray(group.paymentOptions)) {
                            return fastify.httpErrors.badRequest('paymentOptions in categoryGroup must be an array');
                        }
                        
                        for (const payOption of group.paymentOptions) {
                            if (!payOption.name || !payOption.type || typeof payOption.amount !== 'number') {
                                return fastify.httpErrors.badRequest('Each payment option must have name, type, and amount');
                            }
                        }
                    }
                    
                    // Validate each category in the group
                    for (const categoryId of group.categories) {
                        if (!validCategoryIds.has(categoryId)) {
                            return fastify.httpErrors.badRequest(`Category "${categoryId}" in group "${group.name}" does not exist in regCategories`);
                        }
                        
                        if (allAssignedCategories.has(categoryId)) {
                            return fastify.httpErrors.badRequest(`Category "${categoryId}" appears in multiple category groups. Each category can only be in one group.`);
                        }
                        
                        allAssignedCategories.add(categoryId);
                    }
                }
            }

            // Insert the new series
            const result = await this.mongo.db.collection('series').insertOne(seriesData);

            if (!result.insertedId) {
                return fastify.httpErrors.internalServerError('Failed to create series');
            }

            fastify.log.info({ seriesId }, 'Series created successfully');

            return seriesData;
        }
    });

    // POST /api/series/:id/races - Bulk update races to add/remove them from a series
    fastify.post('/:id/races', {
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.params.id) {
                return fastify.httpErrors.badRequest('You must provide a series ID');
            }

            const seriesId = request.params.id;
            
            // Verify series exists
            const series = await this.mongo.db.collection('series').findOne({ 
                $or: [
                    { seriesId: seriesId },
                    { series: seriesId }
                ]
            });

            if (!series) {
                return fastify.httpErrors.notFound('Series not found');
            }

            // Validate request body
            if (!request.body.raceIds || !Array.isArray(request.body.raceIds)) {
                return fastify.httpErrors.badRequest('raceIds array is required');
            }

            if (request.body.raceIds.length === 0) {
                return fastify.httpErrors.badRequest('raceIds array cannot be empty');
            }

            const action = request.body.action; // 'add' or 'remove'
            if (!action || !['add', 'remove'].includes(action)) {
                return fastify.httpErrors.badRequest('action must be "add" or "remove"');
            }

            // Build the update based on action
            let updateOperation;
            if (action === 'add') {
                updateOperation = { $set: { series: seriesId } };
            } else {
                updateOperation = { $unset: { series: "" } };
            }

            // Perform bulk update
            const result = await this.mongo.db.collection('races').updateMany(
                { raceid: { $in: request.body.raceIds } },
                updateOperation
            );

            fastify.log.info({ 
                seriesId, 
                action,
                raceIds: request.body.raceIds,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            }, 'Bulk race update completed');

            return {
                success: true,
                action,
                seriesId,
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                raceIds: request.body.raceIds
            };
        }
    });
}