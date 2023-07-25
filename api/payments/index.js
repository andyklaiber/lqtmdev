
const _ = require('lodash');
const Stripe = require('stripe');
const dayjs = require('dayjs');
const { getFees, updateRacePaymentOptions } = require("../../src/fees");
const { generate, parse, transform, stringify } = require('csv/sync');

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
            
            await this.mongo.db.collection('payments').updateOne({ _id: this.mongo.ObjectId(request.query.paymentId)}, { $set:{ regData:paymentData, status: 'paid'} }, { upsert: true });

            const raceData = await this.mongo.db.collection('races').findOne({ raceid: paymentData.raceid });
            return await fastify.registerRacer(_.omit(paymentData,['paymentAmount, paymentRecieved']), paymentId, raceData, request.log, false);
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
                await this.mongo.db.collection('payments').updateOne({ _id: this.mongo.ObjectId(request.query.paymentId)}, { $set:{ regData:paymentData, status: 'paid'} }, { upsert: true });
            }

            const raceData = await this.mongo.db.collection('races').findOne({ raceid: paymentData.raceid });
            return await fastify.registerRacer(_.omit(paymentData,['paymentAmount, paymentRecieved']), paymentId, raceData, request.log, false);
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
            let paymentObjId = this.mongo.ObjectId(request.query.paymentId)
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
        const raceData = await this.mongo.db.collection('races').findOne({ raceid });
        if(!raceData){
            throw fastify.httpErrors.notFound('Race not found');
        }
        if(raceData.couponsEnabled && raceData.couponCodes[couponCode]){
            let { fractionDiscount, singleUse, redemptionPaymentId } = raceData.couponCodes[couponCode];
            if(singleUse && redemptionPaymentId){
                return {validCoupon: false, reason: 'Code has already been redeemed', paymentOptions: updateRacePaymentOptions(raceData.paymentOptions)}
            }
            return {validCoupon:true, paymentOptions: updateRacePaymentOptions(raceData.paymentOptions, fractionDiscount) }
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
        const result = await this.mongo.db.collection('payments').findOne({ '_id': this.mongo.ObjectId(request.query.payment_id) },{
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
    fastify.post('/start-registration', async function (request, reply) {
        if (!request.query.race || !request.body.paytype) {
            throw fastify.httpErrors.badRequest('Missing race id or paytype');
        }
        const regData = request.body
        regData.raceid = request.query.race;
        const raceData = await this.mongo.db.collection('races').findOne({ raceid: request.query.race });
        if(!raceData){
            throw fastify.httpErrors.badRequest('Race not found');
        }
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
            let prevReg = await this.mongo.db.collection('payments').findOne({ '_id': this.mongo.ObjectId(regData.prevPaymentId) });
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

        const paymentRecord = await this.mongo.db.collection('payments').insertOne({ regData });
        //see if they registered for a sponsored category
        const regCat = _.find(raceData.regCategories, {"id": regData.category});
        if(request.body.paytype === 'cash'){
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ status: "unpaid", regData } });
            return {redirect: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`};
        }
        if(regCat && regCat.sponsored){
            // initate registration flow without payment
            regData.paytype = 'season',
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ sponsoredPayment: true, status: "paid", regData } }, { upsert: true });
            request.log.info(regData, 'registering racer in sponsored category');
            await fastify.registerRacer(regData, paymentRecord.insertedId, raceData, request.log);
            return {redirect: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`};
        }else{
            if(regData.coupon && raceData.couponsEnabled && raceData.couponCodes[regData.coupon]){
                let { fractionDiscount } = raceData.couponCodes[regData.coupon];
                regData.fractionDiscount = fractionDiscount;
                raceData.paymentOptions = updateRacePaymentOptions(raceData.paymentOptions, fractionDiscount);
            }
            let payDets = _.find(raceData.paymentOptions, (payment) => payment.type === request.body.paytype);
            if(regCat && regCat.paytype){
                payDets = _.find(raceData.paymentOptions, (payment) => payment.type === regCat.paytype);
            }
            if (!payDets) {
                throw fastify.httpErrors.badRequest('Payment type not found');
            }
            if(payDets.amount == 0){
                let { singleUse, redemptionPaymentId } = raceData.couponCodes[regData.coupon];
                if (singleUse) {
                    if (redemptionPaymentId) {
                        return { message: "The provided coupon has already been redeemed" }
                    }
                    raceData.couponCodes[regData.coupon].redemptionPaymentId = paymentRecord.insertedId;
                    
                    await this.mongo.db.collection('races').updateOne({ raceid: regData.raceid }, {$set:{couponCodes:raceData.couponCodes}})
                }
                await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ couponCode:regData.coupon, status: "paid", regData } }, { upsert: true });
                await fastify.registerRacer(regData, paymentRecord.insertedId, raceData, request.log);
                return {redirect: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`};
            }
            if (!raceData.stripeMeta?.accountId) {
                throw fastify.httpErrors.internalServerError('Stripe connect account not defined');
            }
            let regAmt = parseFloat(payDets.amount);
            let { stripeFee, regFee, priceInCents } = getFees(payDets.amount);
            if(raceData.optionalPurchases && regData.optionalPurchases){
                raceData.optionalPurchases.forEach(({ id, amount }) => {
                    if (regData.optionalPurchases && regData.optionalPurchases[id]) {
                        regAmt += parseFloat(amount);
                    }
                })
                let allFees = getFees(regAmt)
                priceInCents = allFees.priceInCents;
                regFee = allFees.regFee;
                stripeFee= allFees.stripeFee;
            }
            const sessionConfig = 
            {
                line_items: [{
                    quantity: 1,
                    price_data:{
                        currency: 'USD',
                        unit_amount: priceInCents + stripeFee + regFee, // in cents
                        product_data:{
                            name: raceData.displayName + ' ' + payDets.name,
                            description: payDets.description || payDets.type + ' entry fee'
                        },
                    }
                }],
                invoice_creation: {enabled: true},
                mode: 'payment',
                success_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`,
                cancel_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`,
                customer_email: regData.email,
                payment_intent_data: {
                    description: raceData.displayName + ' ' + payDets.name,
                    application_fee_amount: regFee,
                },
            }
            let stripe;
            if(raceData.isTestData){
                stripe = Stripe(process.env.STRIPE_SECRET_KEY_DEV)
            }else{
                stripe = Stripe(process.env.STRIPE_SECRET_KEY)
            }
            request.log.info({regData, sessionConfig}, 'initiating stripe checkout');
            const session = await stripe.checkout.sessions.create(sessionConfig, {
                stripeAccount: raceData.stripeMeta.accountId,
            });
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ payment_id: session.id, stripePayment:session,  status: session.payment_status, couponCode:regData.coupon, } }, { upsert: true });
            return {redirect: session.url};
        }
    });
}


