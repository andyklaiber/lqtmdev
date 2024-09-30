'use strict'
const _ = require('lodash');
const axios = require('axios');
const fp = require('fastify-plugin')
const { capitalizeName } = require('../src/result_lib');
const dayjs = require('dayjs');
const handlebars = require('handlebars');
 

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
    const racerData = {
      ...regData,
        paymentId
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
    if(_.indexOf(regData.email,'test.com') > -1){
      logger.info({regData},'test email, not sending confirmation email');
      return;
    }
    const regCat = _.find(raceData.regCategories, {"id": regData.category});
    const data = {
      name:  capitalizeName(regData.first_name + " " + regData.last_name),
      sponsor: regData.sponsor,
      eventHomePageUrl: raceData.eventDetails.homepageUrl,
      eventName: raceData.eventDetails.name,
      eventContactEmail: raceData.contactEmail ? raceData.contactEmail : `support@signup.bike`,
      rosterLink: `${process.env.DOMAIN}/#/roster/${regData.raceid}`,
      category: regCat ? regCat.catdispname : "Category not found",
    }
    let templateString = `<html><head></head><body>
    <h1>Thank you for registering for {{eventName}}</h1>
    <p>
    Name: {{name}}<br>
    Team/Sponsor: {{sponsor}}<br>
    Race Category: {{category}}<br>
    <p><a href="{{rosterLink}}">Go Here</a> to see who else is signed up<p>
    <p>For information about the event, check out <a href="{{eventHomePageUrl}}">{{eventHomePageUrl}}</a></p>
    <p>For issues with your registration information, <a href="mailto:{{eventContactEmail}}">email us!</a></p>
    </body></html>`


    if(raceData.emailTemplate){
      templateString = raceData.emailTemplate
    }

    const template = handlebars.compile(templateString);
    const htmlToSend = template(data);

    return axios.post("https://api.sendinblue.com/v3/smtp/email",{
         "sender":{  
            "name":"Signup.bike",
            "email":"support@signup.bike"
         },
         "to":[  
            {  
               "email":regData.email,
               "name": data.name
            }
         ],
         "subject":`${raceData.eventDetails.name} Registration`,
         "htmlContent":htmlToSend,
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