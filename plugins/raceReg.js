'use strict'
const axios = require('axios');
const fp = require('fastify-plugin')

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

module.exports = fp(async function (fastify, opts) {
  fastify.decorate('registerRacer', async function (regData, paymentId, raceData) {
    // payment type - single or season
    // registrant data, race category id, payment id - reference, add to race racers[] array
    const racerData = {
      ...regData,
        paymentId
    }
    delete racerData.raceid
    // fastify.log.info(racerData, );
    if(regData.paytype === 'season'){
      return await this.mongo.db.collection('races').updateMany({ series: raceData.series },
        {$push: {registeredRacers: racerData}});
    }else{
      return await this.mongo.db.collection('races').updateOne({ raceid: regData.raceid },
        {$push: {registeredRacers: racerData}});
    }
    
  })
  fastify.decorate('sendRegConfirmEmail', async function (regData, raceData) {
    const template = `<html><head></head><body>
    <h1>Thank you for registering with signup.bike!</h1>
    </body></html>`
    axios.post("https://api.sendinblue.com/v3/smtp/email",{
         "sender":{  
            "name":"Signup.bike Registration",
            "email":"support@signup.bike"
         },
         "to":[  
            {  
               "email":regData.email,
               "name":`${regData.first_name}  ${regData.last_name}`
            }
         ],
         "subject":"test mail",
         "htmlContent":template,
         "headers":{  
           "charset":"iso-8859-1"
         },
         "tags":[`race:${raceData.raceid}`]
    },
    {
      headers:{
        "accept": "application/json",
        "api-key":process.env.SENDINBLUE_API_KEY,
        "content-type": "application/json"
      }
    })
      .then()
      .catch();
  })
})
