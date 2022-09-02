
const _ = require('lodash');
const Stripe = require('stripe');

module.exports = async function (fastify, opts) {

    fastify.addContentTypeParser(
        "application/json",
        { parseAs: "buffer" },
        function (_req, body, done) {
            try {
                done(null, body)
            } catch (error) {
                error.statusCode = 400
                done(error, undefined)
            }
        }
    )
    fastify.post('/stripe/dev', async function (request,response){

        const WEBHOOK_KEY = process.env.STRIPE_WH_KEY_DEV
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY_DEV)

        const payload = request.body;
        const sig = request.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(payload, sig, WEBHOOK_KEY);
        } catch (err) {
            throw fastify.httpErrors.badRequest(`Webhook Error: ${err.message}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const pendingPayment = await this.mongo.db.collection('payments').findOne({ 'payment_id': session.id });
            if(pendingPayment){
                request.log.info('found payment with stripe id: '+session.id)
                if(pendingPayment.stripePayment?.payment_status === 'unpaid'){
                    //update and register
                    await this.mongo.db.collection('payments').updateOne({ 'payment_id': session.id }, { $set:{ stripePayment:session, status: session.payment_status} }, { upsert: true });
                    const raceData = await this.mongo.db.collection('races').findOne({ raceid: pendingPayment.regData.raceid });
                    await fastify.registerRacer(pendingPayment.regData, pendingPayment._id, raceData, request.log);
                }else{
                    throw fastify.httpErrors.conflict(`Expected unpaid payment. \n
                    Payment_id:${session.id},\n
                    Status${pendingPayment.stripePayment.payment_status}
                    `)
                }

            }else{
                request.log.info("Webhook event: "+ event.type)
            }
        }
            else{
                request.log.info('got webhook: '+ event.type);
            }
        return 'great success!!!'
    })

    fastify.post('/stripe', async function (request,response){
        
        const WEBHOOK_KEY = process.env.STRIPE_WH_KEY
        const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
        
        const payload = request.body;
        const sig = request.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(payload, sig, WEBHOOK_KEY);
        } catch (err) {
            throw fastify.httpErrors.badRequest(`Webhook Error: ${err.message}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const pendingPayment = await this.mongo.db.collection('payments').findOne({ 'payment_id': session.id });
            if(pendingPayment){
                request.log.info('found payment with stripe id: '+session.id)
                if(pendingPayment.stripePayment?.payment_status === 'unpaid'){
                    //update and register
                    await this.mongo.db.collection('payments').updateOne({ 'payment_id': session.id }, { $set:{ stripePayment:session, status: session.payment_status} }, { upsert: true });
                    const raceData = await this.mongo.db.collection('races').findOne({ raceid: pendingPayment.regData.raceid });
                    await fastify.registerRacer(pendingPayment.regData, pendingPayment._id, raceData, request.log);
                }else{
                    throw fastify.httpErrors.conflict(`Expected unpaid payment. \n
                    Payment_id:${session.id},\n
                    Status${pendingPayment.stripePayment.payment_status}
                    `)
                }

            }else{
                request.log.info("Webhook event: "+ event.type)
            }
        }
            else{
                request.log.info('got webhook: '+ event.type);
            }
        return 'great success!!!'
    })
}


