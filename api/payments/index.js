
const _ = require('lodash');
const moment = require('moment');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async function (fastify, opts) {
    fastify.get('/status', async function(request,reply){
        const result = await this.mongo.db.collection('payments').findOne({ '_id': new ObjectId(request.query.payment_id) });
        if (result) {
            let returnObj = _.pick(result, 'regData', 'stripePayment.payment_status', 'stripePayment.url');
            return returnObj;
        } else {
            return fastify.httpErrors.notFound();
        }
    });
    fastify.post('/create-checkout-session', async function (request, reply) {
        if (!request.query.series || !request.body.paytype) {
            throw fastify.httpErrors.badRequest('Missing series or paytype');
        }
        const regData = request.body
        regData.series = request.query.series;
        console.log('post body:')
        console.dir(regData);
        const seriesData = await this.mongo.db.collection('series').findOne({ series: request.query.series });
        const payDets = _.find(seriesData.paymentOptions, (payment) => payment.type === request.body.paytype);
        if (!payDets) {
            throw fastify.httpErrors.badRequest('Payment type not found');
        }
        if (!seriesData.stripeMeta?.accountId) {
            throw fastify.httpErrors.preconditionFailed('Stripe connect account not defined');
        }
        const paymentRecord = await this.mongo.db.collection('payments').insertOne({ regData });
        const regFee = 100 + (payDets.amount* 100 * .04)
        const sessionConfig = 
        {
            line_items: [{
                quantity: 1,
                price_data:{
                    currency: 'USD',
                    unit_amount: (payDets.amount * 100) + regFee, // in cents
                    product_data:{
                        name: payDets.name,
                        description: payDets.description || payDets.type + 'entry fee'
                    },
                }
            }],
            mode: 'payment',
            success_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.series}/${paymentRecord.insertedId}`,
            cancel_url: `${process.env.DOMAIN}/#/regconfirmation/${regData.series}/${paymentRecord.insertedId}`,
            payment_intent_data: {
                application_fee_amount: regFee,
            },
            metadata:{
                class:'B Men'
            },
        }
        console.dir(sessionConfig);
        console.log(seriesData.stripeMeta.accountId)
        const session = await stripe.checkout.sessions.create(sessionConfig, {
            stripeAccount: seriesData.stripeMeta.accountId,
        });
        await this.mongo.db.collection('payments').updateOne({ '_id': new ObjectId(paymentRecord.insertedId) }, { $set:{ payment_id: session.id, stripePayment:session} }, { upsert: true });
        return session.url;
    });
}


