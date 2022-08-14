
const _ = require('lodash');
const moment = require('moment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    fastify.post('/stripe', async function (request, response) {
        const payload = request.body;
        const sig = request.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WH_KEY);
        } catch (err) {
            throw fastify.httpErrors.badRequest(`Webhook Error: ${err.message}`);
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            console.dir(session);
            const pendingPayment = await this.mongo.db.collection('payments').findOne({ 'payment_id': session.id });
            if(pendingPayment){
                console.log('found payment with id: '+session.id)
                if(pendingPayment.stripePayment?.payment_status === 'unpaid'){
                    //update and register
                    await this.mongo.db.collection('payments').updateOne({ 'payment_id': session.id }, { $set:{ stripePayment:session } }, { upsert: true });

                }else{
                    throw fastify.httpErrors.conflict(`Expected unpaid payment. \n
                    Payment_id:${session.id},\n
                    Status${pendingPayment.stripePayment.payment_status}
                    `)
                }

            }else{

            }
        }
            else{
                console.log('got webhook: '+ event.type);
            }
        return 'great success!!!'
    });
}


