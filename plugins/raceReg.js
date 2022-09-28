'use strict'
const _ = require('lodash');
const axios = require('axios');
const fp = require('fastify-plugin')
const dayjs = require('dayjs');
 

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

module.exports = fp(async function (fastify, opts) {
  fastify.decorate('registerRacer', async function (regData, paymentId, raceData, logger, sendEmail=true) {
    // payment type - single or season
    // registrant data, race category id, payment id - reference, add to race racers[] array
    const racerData = {
      ...regData,
        paymentId
    }
    delete racerData.raceid
    // fastify.log.info(racerData, );
    if(regData.paytype === 'season'){
      await this.mongo.db.collection('races').updateMany({ series: raceData.series },
        {$push: {registeredRacers: racerData}});
    }else{
      await this.mongo.db.collection('races').updateOne({ raceid: regData.raceid },
        {$push: {registeredRacers: racerData}});
    }
    if(sendEmail){
      return fastify.sendRegConfirmEmail(regData, paymentId, raceData, logger);
    }
    return {};
  })
  fastify.decorate('sendRegConfirmEmail', async function (regData, paymentId, raceData, logger) {
    const regCat = _.find(raceData.regCategories, {"id": regData.category});
    const template = `<html><head></head><body>
    <h1>Thank you for registering for ${raceData.eventDetails.name}</h1>
    <p>
    Name: ${_.capitalize(regData.first_name)}  ${_.capitalize(regData.last_name)}<br>
    ${regData.sponsor ? `Team/Sponsor: ${regData.sponsor}<br>` :""}
    Race Category: ${regCat.catdispname}<br>
    <p><a href="${process.env.DOMAIN}/#/roster/${regData.raceid}">Go Here</a> to see who else is signed up<p>
    <p>For information about the event, check out <a href="${raceData.eventDetails.homepageUrl}">${raceData.eventDetails.homepageUrl}</a></p>
    <p>For issues with your registration information, <a href="mailto:support@signup.bike">email us!</a>
    </body></html>`
    return axios.post("https://api.sendinblue.com/v3/smtp/email",{
         "sender":{  
            "name":"Signup.bike",
            "email":"support@signup.bike"
         },
         "to":[  
            {  
               "email":regData.email,
               "name":`${regData.first_name}  ${regData.last_name}`
            }
         ],
         "subject":`${raceData.eventDetails.name} Registration`,
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
      .then((resp)=>{

      })
      .catch((err)=>{
        console.log(err.config);
        console.log(err.message);
        logger.error('error received sending email',{regData})
      });
  })
})
