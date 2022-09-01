
const _ = require('lodash');
const Stripe = require('stripe');
const { getFees } = require("../../src/fees");

module.exports = async function (fastify, opts) {
    // fastify.post('/email', async function(request){
    //     return fastify.sendRegConfirmEmail(request.body,'6311229e5e02e649cc13a7bf', {
    //         raceid: 'test_race_id', 
    //         eventDetails:{
    //             name:"2022 Rodeo Cross",
    //             homepageUrl:"http://folsomrodeocross.com"
    //         }
    //     })
    // })    
    
    fastify.get('/status', async function(request,reply){
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
        if(regCat && regCat.sponsored){
            // initate registration flow without payment
            regData.paytype = 'season',
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ sponsoredPayment: true, status: "paid", regData } }, { upsert: true });
            request.log.info(regData, 'registering racer in sponsored category');
            const results = await fastify.registerRacer(regData, paymentRecord.insertedId, raceData, request.log);
            return `${process.env.DOMAIN}/#/regconfirmation/${regData.raceid}/${paymentRecord.insertedId}`;
        }else{

            const payDets = _.find(raceData.paymentOptions, (payment) => payment.type === request.body.paytype);
            if (!payDets) {
                throw fastify.httpErrors.badRequest('Payment type not found');
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
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(paymentRecord.insertedId) }, { $set:{ payment_id: session.id, stripePayment:session,  status: session.payment_status } }, { upsert: true });
            return session.url;
        }
    });
}


