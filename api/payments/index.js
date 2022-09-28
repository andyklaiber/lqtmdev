
const _ = require('lodash');
const Stripe = require('stripe');
const { getFees, updateRacePaymentOptions } = require("../../src/fees");

module.exports = async function (fastify, opts) {
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
        
            if (payment && payment.regData.paytype == 'single') {
                let pullResult = await this.mongo.db.collection('races').updateMany(
                    {series: raceData.series },
                    { $pull: { registeredRacers: { paymentId: request.query.paymentId } } }
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
            let { fractionDiscount } = raceData.couponCodes[couponCode];
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
        const paymentRecord = await this.mongo.db.collection('payments').insertOne({ regData });
        //see if they registered for a sponsored category
        const regCat = _.find(raceData.regCategories, {"id": regData.category});
        if(request.body.paytype === 'cash'){
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ status: "unpaid", regData } });
            return `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`;
        }
        if(regCat && regCat.sponsored){
            // initate registration flow without payment
            regData.paytype = 'season',
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ sponsoredPayment: true, status: "paid", regData } }, { upsert: true });
            request.log.info(regData, 'registering racer in sponsored category');
            await fastify.registerRacer(regData, paymentRecord.insertedId, raceData, request.log);
            return `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`;
        }else{
            if(regData.coupon && raceData.couponsEnabled && raceData.couponCodes[regData.coupon]){
                let { fractionDiscount } = raceData.couponCodes[regData.coupon];
                raceData.paymentOptions = updateRacePaymentOptions(raceData.paymentOptions, fractionDiscount);
            }
            const payDets = _.find(raceData.paymentOptions, (payment) => payment.type === request.body.paytype);
            if (!payDets) {
                throw fastify.httpErrors.badRequest('Payment type not found');
            }
            if(payDets.amount == 0){
                await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ couponCode:regData.coupon, status: "paid", regData } }, { upsert: true });
                await fastify.registerRacer(regData, paymentRecord.insertedId, raceData, request.log);
                return `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`;
            }
            if (!raceData.stripeMeta?.accountId) {
                throw fastify.httpErrors.preconditionFailed('Stripe connect account not defined');
            }
            const { regFee, stripeFee } = getFees(payDets.amount);
            const sessionConfig = 
            {
                line_items: [{
                    quantity: 1,
                    price_data:{
                        currency: 'USD',
                        unit_amount: (payDets.amount * 100) + regFee + stripeFee, // in cents
                        product_data:{
                            name: raceData.displayName + ' ' + payDets.name,
                            description: payDets.description || payDets.type + ' entry fee'
                        },
                    }
                }],
                mode: 'payment',
                success_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`,
                cancel_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`,
                payment_intent_data: {
                    application_fee_amount: regFee,
                },
            }
            let stripe;
            if(raceData.isTestData){
                stripe = Stripe(process.env.STRIPE_SECRET_KEY_DEV)
            }else{
                stripe = Stripe(process.env.STRIPE_SECRET_KEY)
            }
            const session = await stripe.checkout.sessions.create(sessionConfig, {
                stripeAccount: raceData.stripeMeta.accountId,
            });
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ payment_id: session.id, stripePayment:session,  status: session.payment_status, couponCode:regData.coupon, } }, { upsert: true });
            return session.url;
        }
    });
}


