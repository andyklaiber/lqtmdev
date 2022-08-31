
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
    fastify.post('/stripe/dev', async function (request,response){return handler(request,response, true)})

    fastify.post('/stripe', async function (request,response){return handler(request,response, false)})
    let handler = async function (request, response, isDev) {
        let stripe, WEBHOOK_KEY;
        if(isDev){
            WEBHOOK_KEY = process.env.STRIPE_WH_KEY_DEV
            stripe = Stripe(process.env.STRIPE_SECRET_KEY_DEV)
        }else{
            WEBHOOK_KEY = process.env.STRIPE_WH_KEY
            stripe = Stripe(process.env.STRIPE_SECRET_KEY)
        }
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
                request.log.info('found payment with id: '+session.id)
                if(pendingPayment.stripePayment?.payment_status === 'unpaid'){
                    //update and register
                    await this.mongo.db.collection('payments').updateOne({ 'payment_id': session.id }, { $set:{ stripePayment:session, status: session.payment_status} }, { upsert: true });
                    await fastify.registerRacer(pendingPayment.regData, pendingPayment.insertedId);
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
    };
}


