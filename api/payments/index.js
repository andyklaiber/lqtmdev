
const _ = require('lodash');
const Stripe = require('stripe');
const dayjs = require('dayjs');
const { getFees, updateRacePaymentOptions } = require("../../src/fees");
const { generate, parse, transform, stringify } = require('csv/sync');
const { processRaceWithSeriesData } = require('../../src/lib/raceProcessing');

/**
 * Apply category-specific pricing from series data
 * Uses series category group pricing by default for categories in groups
 * 
 * @param {Object} paymentOption - The race payment option (or partial with just {type})
 * @param {string} categoryId - The category ID
 * @param {Object} seriesData - Series data containing categoryGroups
 * @param {Object} log - Logger instance
 * @returns {Object|null} Payment option with applied pricing, or null if not found
 */
function getCategoryPrice(paymentOption, categoryId, seriesData, log) {
    // If no series data or category groups, return the payment option unchanged
    if (!seriesData || !seriesData.categoryGroups || seriesData.categoryGroups.length === 0) {
        return paymentOption;
    }
    
    // Find the category group that includes this category
    const categoryGroup = seriesData.categoryGroups.find(group =>
        group.categories && group.categories.includes(categoryId)
    );
    
    if (categoryGroup) {
        // Find the matching payment option within this group (by type)
        const groupPaymentOption = categoryGroup.paymentOptions?.find(
            opt => opt.type === paymentOption.type
        );
        
        if (groupPaymentOption) {
            // Use series group pricing for this category
            if (log) {
                log.info({ 
                    categoryId, 
                    paymentType: paymentOption.type,
                    groupName: groupPaymentOption.name,
                    groupAmount: groupPaymentOption.amount,
                    raceAmount: paymentOption.amount
                }, 'Applied series group pricing for category');
            }
            
            return {
                type: paymentOption.type,
                amount: groupPaymentOption.amount,
                name: groupPaymentOption.name
            };
        }
    }
    
    // If paymentOption only has type (no amount/name), and not found in groups, return null
    if (!paymentOption.amount && !paymentOption.name) {
        return null;
    }
    
    // Fallback to race payment option (category not in any group)
    if (log) {
        log.info({ 
            categoryId, 
            paymentType: paymentOption.type,
            amount: paymentOption.amount 
        }, 'Category not in any series group, using race payment option');
    }
    
    return paymentOption;
}

/**
 * Process start-registration logic
 * Extracted for testability with dependency injection
 * 
 * @param {Object} params
 * @param {Object} params.regData - Registration data
 * @param {Object} params.raceData - Race data with categories and payment options
 * @param {Object} params.dependencies - Injected dependencies
 * @param {Object} params.dependencies.mongo - MongoDB collection access
 * @param {Function} params.dependencies.createStripeSession - Stripe session creator
 * @param {Function} params.dependencies.registerRacer - Racer registration function
 * @param {Object} params.dependencies.log - Logger
 * @returns {Object} - Result with redirect URL or error
 */
async function processStartRegistration({ regData, raceData, dependencies }) {
    const { mongo, createStripeSession, registerRacer, log } = dependencies;
    
    // Find the category
    const regCat = _.find(raceData.regCategories, {"id": regData.category});
    
    // Handle cash payment
    if (regData.paytype === 'cash') {
        const paymentRecord = await mongo.payments.insertOne({ regData });
        await mongo.payments.updateOne(
            { '_id': paymentRecord.insertedId }, 
            { $set: { status: "unpaid", regData } }
        );
        return {
            redirect: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`
        };
    }
    
    // Handle sponsored category
    if (regCat && regCat.sponsored) {
        const paymentRecord = await mongo.payments.insertOne({ regData });
        regData.paytype = 'season';
        await mongo.payments.updateOne(
            { '_id': paymentRecord.insertedId }, 
            { $set: { sponsoredPayment: true, status: "paid", regData } }
        );
        log.info(regData, 'registering racer in sponsored category');
        await registerRacer(regData, paymentRecord.insertedId, raceData, log);
        return {
            redirect: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`
        };
    }
    
    // Handle coupon application
    if (regData.coupon && raceData.couponsEnabled && raceData.couponCodes[regData.coupon]) {
        let { fractionDiscount, paymentTypes } = raceData.couponCodes[regData.coupon];
        regData.fractionDiscount = fractionDiscount;
        raceData.paymentOptions = updateRacePaymentOptions(raceData.paymentOptions, fractionDiscount, paymentTypes);
    }
    
    // Find payment details - respect user's payment type selection
    let payDets = _.find(raceData.paymentOptions, (payment) => payment.type === regData.paytype);
    
    // If payment not found in race options, check series groups (for season passes)
    // HYBRID MODEL: Series groups provide additional payment options (season passes)
    // that aren't in the race's paymentOptions array
    if (!payDets && raceData.seriesData && regData.category) {
        // Payment type not found in race options - might be a series group payment (season pass)
        // Try to get it from series groups
        payDets = getCategoryPrice({ type: regData.paytype }, regData.category, raceData.seriesData, log);
        
        if (payDets) {
            // Found in series groups - mark as category pricing applied
            regData.categoryPricingApplied = true;
            regData.pricingAmount = payDets.amount;
            regData.pricingName = payDets.name;
        }
    }
    
    if (!payDets) {
        throw new Error('Payment type not found');
    }
    
    // If payment was found in race options, check if series groups provide different pricing
    // (e.g., season pass with category-specific pricing tiers)
    if (raceData.seriesData && regData.category && !regData.categoryPricingApplied) {
        const originalAmount = payDets.amount;
        const originalName = payDets.name;
        
        const updatedPayDets = getCategoryPrice(payDets, regData.category, raceData.seriesData, log);
        
        // Only apply if it actually changed (series group pricing was applied)
        if (updatedPayDets && (updatedPayDets.amount !== originalAmount || updatedPayDets.name !== originalName)) {
            payDets = updatedPayDets;
            regData.categoryPricingApplied = true;
            regData.pricingAmount = payDets.amount;
            regData.pricingName = payDets.name;
        }
    }
    
    // Handle free registration with coupon
    if (payDets.amount == 0) {
        const paymentRecord = await mongo.payments.insertOne({ regData });
        let { singleUse, redemptionPaymentId } = raceData.couponCodes[regData.coupon];
        if (singleUse) {
            if (redemptionPaymentId) {
                return { message: "The provided coupon has already been redeemed" };
            }
            raceData.couponCodes[regData.coupon].redemptionPaymentId = paymentRecord.insertedId;
            await mongo.races.updateOne(
                { raceid: regData.raceid }, 
                { $set: { couponCodes: raceData.couponCodes } }
            );
        }
        await mongo.payments.updateOne(
            { '_id': paymentRecord.insertedId }, 
            { $set: { couponCode: regData.coupon, status: "paid", regData } }
        );
        await registerRacer(regData, paymentRecord.insertedId, raceData, log);
        return {
            redirect: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`
        };
    }
    
    // Validate Stripe configuration
    if (!raceData.stripeMeta?.accountId) {
        throw new Error('Stripe connect account not defined');
    }
    
    // Calculate fees
    let regAmt = parseFloat(payDets.amount);
    let { stripeFee, regFee, priceInCents } = getFees(payDets.amount);
    
    // Add optional purchases
    if (raceData.optionalPurchases && regData.optionalPurchases) {
        raceData.optionalPurchases.forEach(({ id, amount }) => {
            if (regData.optionalPurchases && regData.optionalPurchases[id]) {
                regAmt += parseFloat(amount);
            }
        });
        let allFees = getFees(regAmt);
        priceInCents = allFees.priceInCents;
        regFee = allFees.regFee;
        stripeFee = allFees.stripeFee;
    }
    
    // Create Stripe session config
    const totalAmount = ((priceInCents + stripeFee + regFee) / 100).toFixed(2);
    const sessionConfig = {
        line_items: [{
            quantity: 1,
            price_data: {
                currency: 'USD',
                unit_amount: priceInCents + stripeFee + regFee,
                product_data: {
                    name: raceData.displayName + ' ' + payDets.name,
                    description: payDets.description || `${payDets.type} entry fee - $${totalAmount}`
                },
            }
        }],
        invoice_creation: { enabled: true },
        mode: 'payment',
        success_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/PAYMENT_ID`,
        cancel_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/PAYMENT_ID`,
        customer_email: regData.email,
        payment_intent_data: {
            description: `${raceData.displayName} ${payDets.name} - $${totalAmount}`,
            application_fee_amount: regFee,
        },
    };
    
    log.info({ regData, sessionConfig }, 'initiating stripe checkout');
    
    // Create Stripe session
    const session = await createStripeSession({
        sessionConfig,
        stripeAccountId: raceData.stripeMeta.accountId,
        isTestMode: raceData.isTestData
    });
    
    // Update session config with actual payment ID
    sessionConfig.success_url = sessionConfig.success_url.replace('PAYMENT_ID', session.paymentRecordId);
    sessionConfig.cancel_url = sessionConfig.cancel_url.replace('PAYMENT_ID', session.paymentRecordId);
    
    return { 
        redirect: session.url,
        paymentRecordId: session.paymentRecordId,
        sessionConfig
    };
}

module.exports = async function (fastify, opts) {
    fastify.route({
        method: 'POST',
        url: '/test-confirm-email',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.query.raceId) {
                return fastify.httpErrors.badRequest('You must provide a race ID');
            }
            const testData = {
                first_name: 'Andy',
                last_name: 'emailTester',
                email: 'andy.klaiber@gmail.com',
                sponsor: 'TestSponsorName',
                category: 'b35+_men',
                paytype: 'cash',
                racerAge: 38,
                raceid: request.query.raceId,
                status: 'unpaid',
                paymentId: '63337dd58f99a6907d061a8f',
                bibNumber: '545',
                paymentReceived: true,
                paymentAmount: '25',
                ...request.body
                };
            
            const raceData = await this.mongo.db.collection('races').findOne({ raceid: request.query.raceId });
            await fastify.sendRegConfirmEmail(testData, "testdataID", raceData, request.log);
        }
    });
    // fastify.post('/email', async function(request){
    //     const payments = await this.mongo.db.collection('payments').find({status:"paid"}).toArray();

    //     payments.forEach(async (payRecord)=>{
    //         const raceData = await this.mongo.db.collection('races').findOne({raceid:"rcx_2022_1"});
    //         const existingReg = _.find(raceData.registeredRacers, {paymentId:payRecord._id});
    //         if(existingReg){
    //             console.log('already reg:'+existingReg.email);
    //         }else{
    //             console.log('will add', payRecord.regData.email);
    //             await fastify.registerRacer(payRecord.regData, payRecord._id, raceData, request.log)
    //         }
    //     })
    // })
    //     fastify.post('/register-csv', async function(request){
    //         const raceid = request.query.raceid
    //         const raceData = await this.mongo.db.collection('races').findOne({ raceid });
        
    //         const data = request.body;
    //         freeEntries = parse(data, {columns: true,});

    //     freeEntries.forEach(async (entryRow)=>{
    //         let racerAge = undefined;
    //         if(entryRow.DOB){
    //             const dec31 = dayjs();
    //             const bday = dayjs(entryRow.DOB);
    //             racerAge = dec31.year() - bday.year();
    //         }


    //         const name = entryRow.Name.split(' ');
    //         const first_name = name[0];
    //         const last_name = name.slice(1).join(' ');
    //         const regData = {
    //             first_name,
    //             last_name,
    //             email: entryRow.Email,
    //             category: entryRow.Category,
    //             racerAge,
    //             raceid,
    //             status: 'paid',
    //             paytype: 'comp',

    //         }
    //         //console.log(regData);
    //         let paymentRecord = await this.mongo.db.collection('payments').insertOne({ regData, status: 'paid'});
    //         let paymentId = paymentRecord.insertedId;

    //         return await fastify.registerRacer(regData, paymentId, raceData, request.log, false);
    //     })
    //     //return freeEntries;
    // })
    fastify.route({
        method: 'PUT',
        url: '/register',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.query.raceId) {
                return fastify.httpErrors.badRequest('You must provide a race ID');
            }
            /*
            body:{
            first_name: 'Andy',
            last_name: 'cashTester',
            email: 'andy.klaiber@gmail.com',
            sponsor: 'data',
            category: 'b35+_men',
            paytype: 'cash',
            racerAge: 38,
            raceid: 'rcx_2022_test_1',
            status: 'unpaid',
            paymentId: '63337dd58f99a6907d061a8f',
            bibNumber: '545',
            paymentReceived: true,
            paymentAmount: '25'
            }
            */
            let paymentId=request.query.paymentId;
            if(!paymentId){
                return fastify.httpErrors.badRequest('you must provide a paymentID to register a cash payment')
            }
            request.body.raceid=request.query.raceId;
            let paymentData = _.omit(request.body, ['paymentId','status'])
            
            await this.mongo.db.collection('payments').updateOne({ _id: new this.mongo.ObjectId(request.query.paymentId)}, { $set:{ regData:paymentData, status: 'paid'} }, { upsert: true });

            const raceData = await this.mongo.db.collection('races').findOne({ raceid: paymentData.raceid });
            return await fastify.registerRacer(_.omit(paymentData,['paymentAmount', 'paymentReceived']), paymentId, raceData, request.log, false);
        }
    }) 
    // create new reg or mark cash unpaids as registered for single entry ONLY (for now)
    fastify.route({
        method: 'POST',
        url: '/register',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.query.raceId) {
                return fastify.httpErrors.badRequest('You must provide a race ID');
            }
            /*
            body:{
            first_name: 'Andy',
            last_name: 'cashTester',
            email: 'andy.klaiber@gmail.com',
            sponsor: 'data',
            category: 'b35+_men',
            paytype: 'cash',
            racerAge: 38,
            raceid: 'rcx_2022_test_1',
            status: 'unpaid',
            paymentId: '63337dd58f99a6907d061a8f',
            bibNumber: '545',
            paymentReceived: true,
            paymentAmount: '25'
            }
            */
            let paymentId=request.query.paymentId;
            request.body.raceid=request.query.raceId;
            let paymentData = _.omit(request.body, ['paymentId','status'])
            if (!paymentId) {
                let paymentRecord = await this.mongo.db.collection('payments').insertOne({ regData:paymentData, status: 'paid'});
                paymentId = paymentRecord.insertedId;
            }else
            {
                await this.mongo.db.collection('payments').updateOne({ _id: new this.mongo.ObjectId(request.query.paymentId)}, { $set:{ regData:paymentData, status: 'paid'} }, { upsert: true });
            }

            const raceData = await this.mongo.db.collection('races').findOne({ raceid: paymentData.raceid });
            return await fastify.registerRacer(_.omit(paymentData,['paymentAmount', 'paymentReceived']), paymentId, raceData, request.log, false);
        }
    }) 
    // move a single reg in a series to a new race (can lose bib number, not stored in payment record)
    fastify.route({
        method: 'PUT',
        url: '/move-reg',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
            if (!request.query.raceId) {
                return fastify.httpErrors.badRequest('You must provide a destination race ID');
            }
            if (!request.query.paymentId) {
                return fastify.httpErrors.badRequest('Registered racers must have an existing paymentID');
            }
            let paymentObjId = new this.mongo.ObjectId(request.query.paymentId)
            const raceData = await this.mongo.db.collection('races').findOne({ raceid: request.query.raceId });
            const payment = await this.mongo.db.collection('payments').findOne({ '_id': paymentObjId }, {
                projection: {
                  regData: 1,
                  status: 1,
                  sponsoredPayment: 1,
                }
              });
        
            if (payment && payment.regData.paytype !== 'season') {
                let pullResult = await this.mongo.db.collection('races').updateMany(
                    {series: raceData.series },
                    { $pull: { registeredRacers: { paymentId: paymentObjId } } }
                  )
                
                // set race id to destination race id
                payment.regData.raceid=request.query.raceId;
                let updatePayment = await this.mongo.db.collection('payments').updateOne({ _id: paymentObjId}, { $set:{ "regData.raceid":request.query.raceId,} });
                await fastify.registerRacer(payment.regData, request.query.paymentId, raceData, request.log, false);
                return {pullResult,updatePayment, regData:payment.regData}
            }
            return fastify.httpErrors.notFound('Could Not find single entry payment with Id: '+request.query.paymentId) 
        }
    })       
    fastify.post('/pricing', async function(request,reply){
        const {raceid, couponCode} = request.body
        if (!raceid) {
            return fastify.httpErrors.badRequest('You must provide a race ID');
        }
        const raceData = await this.mongo.db.collection('races').findOne({ raceid });
        if(!raceData){
            throw fastify.httpErrors.notFound('Race not found');
        }
        if(raceData.couponsEnabled && raceData.couponCodes[couponCode]){
            let { fractionDiscount, singleUse, redemptionPaymentId, paymentTypes } = raceData.couponCodes[couponCode];
            if(singleUse && redemptionPaymentId){
                return {validCoupon: false, reason: 'Code has already been redeemed', paymentOptions: updateRacePaymentOptions(raceData.paymentOptions)}
            }
            return {validCoupon:true, paymentOptions: updateRacePaymentOptions(raceData.paymentOptions, fractionDiscount, paymentTypes) }
        }
        
        return {validCoupon:false, paymentOptions: updateRacePaymentOptions(raceData.paymentOptions)}
    });
    fastify.route({
        method: 'GET',
        url: '/',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function(request,reply){
            const result = await this.mongo.db.collection('payments').find(
            ).toArray();
            if (result) {
                return result;
            } else {
                return fastify.httpErrors.notFound();
            }
        }
    });
    fastify.route({
        method: 'GET',
        url: '/:raceid',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function(request,reply){
            const result = await this.mongo.db.collection('payments').find({"regData.raceid":request.params.raceid}).toArray();
            if (result) {
                return result;
            } else {
                return fastify.httpErrors.notFound();
            }
        }
    });
    fastify.get('/status', async function(request,reply){
        if(!request.query.payment_id){
            return fastify.httpErrors.badRequest('Must provide payment_id query param');
        }
        const result = await this.mongo.db.collection('payments').findOne({ '_id': new this.mongo.ObjectId(request.query.payment_id) },{
            projection:{
                regData: 1,
                status: 1,
                sponsoredPayment:1,
                'stripePayment.url':1
            }
        });
        if (result) {
            return result;
        } else {
            return fastify.httpErrors.notFound();
        }
    });
    fastify.get('/receipt', async function(request,reply){
        if(!request.query.payment_id){
            return fastify.httpErrors.badRequest('Must provide payment_id query param');
        }
        const payment = await this.mongo.db.collection('payments').findOne({ '_id': new this.mongo.ObjectId(request.query.payment_id) },{
            projection:{
                stripePayment: 1,
                regData: 1
            }
        });
        if (!payment) {
            return fastify.httpErrors.notFound('Payment not found');
        }
        
        if (!payment.stripePayment || !payment.stripePayment.payment_intent) {
            return fastify.httpErrors.badRequest('No Stripe payment found for this payment record');
        }
        
        // Determine if this is test mode or live mode
        const raceData = await this.mongo.db.collection('races').findOne({ raceid: payment.regData.raceid });
        const isTestMode = raceData?.isTestData || false;
        
        // Initialize Stripe with appropriate key
        const stripe = isTestMode 
            ? Stripe(process.env.STRIPE_SECRET_KEY_DEV)
            : Stripe(process.env.STRIPE_SECRET_KEY);
        
        try {
            // Retrieve the payment intent to get the charge ID
            const paymentIntent = await stripe.paymentIntents.retrieve(
                payment.stripePayment.payment_intent,
                { stripeAccount: raceData.stripeMeta.accountId }
            );
            
            if (!paymentIntent.latest_charge) {
                return fastify.httpErrors.notFound('No charge found for this payment');
            }
            
            // Retrieve the charge to get the receipt URL
            const charge = await stripe.charges.retrieve(
                paymentIntent.latest_charge,
                { stripeAccount: raceData.stripeMeta.accountId }
            );
            
            if (!charge.receipt_url) {
                return fastify.httpErrors.notFound('No receipt URL available for this charge');
            }
            
            return { 
                receipt_url: charge.receipt_url,
                payment_id: request.query.payment_id
            };
        } catch (error) {
            request.log.error({ error, payment_id: request.query.payment_id }, 'Error retrieving receipt from Stripe');
            throw fastify.httpErrors.internalServerError('Failed to retrieve receipt from Stripe');
        }
    });
    fastify.post('/start-registration', async function (request, reply) {
        if (!request.query.race || !request.body.paytype) {
            throw fastify.httpErrors.badRequest('Missing race id or paytype');
        }
        const regData = request.body
        regData.raceid = request.query.race;
        
        // Use aggregation pipeline to fetch race with series data
        const pipeline = [
            {
                $match: { raceid: request.query.race }
            },
            {
                $limit: 1
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
        
        const raceResults = await this.mongo.db.collection('races').aggregate(pipeline).toArray();
        if(!raceResults || raceResults.length === 0){
            throw fastify.httpErrors.badRequest('Race not found');
        }
        
        let raceData = raceResults[0];
        
        // Process series data to enrich payment options with category-specific pricing
        raceData = processRaceWithSeriesData(raceData, request.log);
        // check for registration entry limit
        if(raceData.entryCountMax && raceData.entryCountMax > 1){
            if(raceData.registeredRacers?.length >= raceData.entryCountMax){
                return {message: `Sorry, This event has reached the registration max of ${raceData.entryCountMax} participants`}
            }
        }
        //see if they are already signed up
        let existingReg = _.find(raceData.registeredRacers,{
            first_name:regData.first_name,
            last_name: regData.last_name,
            email: regData.email,
            category: regData.category
        })
        if(existingReg){
            throw fastify.httpErrors.conflict('There is already a registration with the same name, email and category');
        }

        if(regData.prevPaymentId){
            //let prevSingleReg = await fastify.findSeriesRacerByBib(bibNumber, series);
            let prevReg = await this.mongo.db.collection('payments').findOne({ '_id': new this.mongo.ObjectId(regData.prevPaymentId) });
            if(prevReg){
                delete regData.prevPaymentId;
                _.defaults(regData, prevReg.regData);
                delete regData.paymentReceived;
                delete regData.paymentAmount
            }
            else{
                throw fastify.httpErrors.badRequest('Could not find requested previous registration information');
            }
        }

        // Create Stripe session creator with real Stripe integration
        const createStripeSession = async ({ sessionConfig, stripeAccountId, isTestMode }) => {
            let stripe;
            if (isTestMode) {
                stripe = Stripe(process.env.STRIPE_SECRET_KEY_DEV);
            } else {
                stripe = Stripe(process.env.STRIPE_SECRET_KEY);
            }
            
            // Create payment record first
            const paymentRecord = await this.mongo.db.collection('payments').insertOne({ regData });
            
            // Update URLs with actual payment ID
            sessionConfig.success_url = sessionConfig.success_url.replace('PAYMENT_ID', paymentRecord.insertedId);
            sessionConfig.cancel_url = sessionConfig.cancel_url.replace('PAYMENT_ID', paymentRecord.insertedId);
            
            // Create Stripe session
            const session = await stripe.checkout.sessions.create(sessionConfig, {
                stripeAccount: stripeAccountId,
            });
            
            // Store session in database
            await this.mongo.db.collection('payments').updateOne(
                { '_id': paymentRecord.insertedId }, 
                { 
                    $set: { 
                        payment_id: session.id, 
                        stripePayment: session,  
                        status: session.payment_status, 
                        couponCode: regData.coupon 
                    } 
                }
            );
            
            return {
                url: session.url,
                paymentRecordId: paymentRecord.insertedId,
                sessionId: session.id
            };
        };

        // Use the extracted function with injected dependencies
        const result = await processStartRegistration({
            regData,
            raceData,
            dependencies: {
                mongo: {
                    payments: this.mongo.db.collection('payments'),
                    races: this.mongo.db.collection('races')
                },
                createStripeSession,
                registerRacer: fastify.registerRacer,
                log: request.log
            }
        });
        
        return result;
    });
}

// Export functions for testing
module.exports.getCategoryPrice = getCategoryPrice;
module.exports.processStartRegistration = processStartRegistration;
