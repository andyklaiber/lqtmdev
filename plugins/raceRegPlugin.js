'use strict'
const _ = require('lodash');
const axios = require('axios');
const fp = require('fastify-plugin')
const { capitalizeName } = require('../src/result_lib');
const dayjs = require('dayjs');
const emailTemplates = require('../lib/emailTemplates');
 

// the use of fastify-plugin is required to be able
// to export the decorators to the outer scope

module.exports = fp(async function (fastify, opts) {
  fastify.decorate('findSeriesRacerByBib', async function (bibNumber, series){
    const raceData = await this.mongo.db.collection('races').find({ series }, {
      projection: {
        "registeredRacers": 1
      }
    }).toArray();
    if(!raceData){
        throw fastify.httpErrors.notFound('Race not found');
    }
    let allracers = []
    raceData.forEach(({registeredRacers})=>{
      allracers = [...allracers, ...registeredRacers];
    })
    let result = _.reverse(allracers).find((racer)=>{
      return bibNumber == racer.bibNumber;
    })
    return result;
  })
  fastify.decorate('registerRacer', async function (regData, paymentId, raceData, logger, sendEmail=true) {
    // payment type - single or season
    // registrant data, race category id, payment id - reference, add to race racers[] array
    
    // Ensure paymentId is always stored as ObjectId for consistency
    const paymentIdObj = typeof paymentId === 'string' 
      ? new this.mongo.ObjectId(paymentId) 
      : paymentId;
    
    const racerData = {
      ...regData,
        paymentId: paymentIdObj
    }
    // fastify.log.info(racerData, );
    if(regData.paytype === 'season'){
      if(raceData.series){
        await this.mongo.db.collection('races').updateMany({ series: raceData.series },
          {$addToSet: {registeredRacers: racerData}});
        }else{
          await this.mongo.db.collection('races').updateOne({ raceid: regData.raceid },
            {$addToSet: {registeredRacers: racerData}});    
        }
    }else{
      await this.mongo.db.collection('races').updateOne({ raceid: regData.raceid },
        {$addToSet: {registeredRacers: racerData}});
    }
    if(sendEmail){
      return fastify.sendRegConfirmEmail(regData, paymentId, raceData, logger);
    }
    return {regData, paymentId};
  })
  fastify.decorate('sendRegConfirmEmail', async function (regData, paymentId, raceData, logger) {
    // Email sender function for dependency injection
    const emailSender = async (emailPayload) => {
      return axios.post("https://api.brevo.com/v3/smtp/email", emailPayload, {
        headers: {
          "accept": "application/json",
          "api-key": process.env.SENDINBLUE_API_KEY,
          "content-type": "application/json"
        }
      });
    };
    
    // Use the new email template service
    return emailTemplates.sendRegistrationEmail({
      regData,
      raceData,
      logger,
      capitalizeName,
      emailSender
    });
  })
})