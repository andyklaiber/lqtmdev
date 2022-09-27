const { update } = require('lodash');
const _ = require('lodash');
const dayjs = require('dayjs');
const { capitalizeName } = require('../../src/result_lib');
const { generate, parse, transform, stringify } = require('csv/sync');

module.exports = async function (fastify, opts) {

  fastify.route({
    //get registered racers
    method: 'GET',
    url: '/race/:id',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }

      const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, {
        projection: {
          "regCategories": 1, "paymentOptions": 1, "registeredRacers": 1,
        }
      })
      const unpaid = await this.mongo.db.collection('payments').find(
        { 'regData.raceid': request.params.id, status: { $ne: 'paid' } },
        { projection: { regData: 1, _id: 1, status: 1 } }).toArray();
      if (result) {
        if (unpaid.length) {
          result.unpaid = unpaid;
        }
        return result;
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  // edit registered racer
  fastify.route({
    method: 'PATCH',
    url: '/race/:id',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }
      if (!request.query.paymentId) {
        return fastify.httpErrors.badRequest('Registered racers must have a paymentID');
      }
      const payment = await this.mongo.db.collection('payments').findOne({ '_id': this.mongo.ObjectId(request.query.paymentId) },{
        projection:{
            regData: 1,
            status: 1,
            sponsoredPayment:1,
        }
    });
      
      if (payment) {

        const allowedFields = [
          "first_name",
          "last_name",
          "email",
          "sponsor",
          "category",
          "racerAge",
          "paytype",
          "bibNumber"
        ]
        let fieldsToSet = {}
        Object.keys(request.body).forEach((keyName) => {
          if (_.includes(allowedFields, keyName)){
            fieldsToSet[`registeredRacers.$.${keyName}`] = request.body[keyName];
          }
        })
        if(Object.keys(fieldsToSet).length < 1){
          return fastify.httpErrors.badRequest('No valid fields provided for update');
        }
        //if part of a series, and paytype==season update all the series records?
        let updateResult;
        if(payment.regData.paytype === 'season'){
          const race = await this.mongo.db.collection('races').find({ 'raceid':payment.regData.raceid}, {projection:{
            series:1
          }})
          updateResult = await this.mongo.db.collection('races').updateOne({
            'raceid': request.params.id,
            "registeredRacers.paymentId": this.mongo.ObjectId(request.query.paymentId)
          },
            { $set: fieldsToSet })
        }
        else{
          updateResult = await this.mongo.db.collection('races').updateOne({
            'raceid': request.params.id,
            "registeredRacers.paymentId": this.mongo.ObjectId(request.query.paymentId)
          },
            { $set: fieldsToSet })

        }


        //if single race, just update the record for the 1 race
        
        return result;
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })

  //move single payment registration racer within series
  fastify.route({
    method: 'PUT',
    url: '/race/:id',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }
      if (!request.query.paymentId) {
        return fastify.httpErrors.badRequest('Registered racers must have a paymentID');
      }
      const payment = await this.mongo.db.collection('payments').findOne({ '_id': this.mongo.ObjectId(request.query.paymentId) },{
        projection:{
            regData: 1,
            status: 1,
            sponsoredPayment:1,
        }
    });
      
      if (payment) {

       
        let fieldsToSet = {}
        Object.keys(request.body).forEach((keyName) => {
          if (_.includes(allowedFields, keyName)){
            fieldsToSet[`registeredRacers.$.${keyName}`] = request.body[keyName];
          }
        })
        if(Object.keys(fieldsToSet).length < 1){
          return fastify.httpErrors.badRequest('No valid fields provided for update');
        }
        

        //if part of a series, and paytype==season update all the series records?


        //if single race, just update the record for the 1 race
        const result = await this.mongo.db.collection('races').updateOne({
          'raceid': request.params.id,
          "registeredRacers.paymentId": this.mongo.ObjectId(request.query.paymentId)
        },
          { $set: fieldsToSet })
        return result;
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  // export to csv
  fastify.route({
    method: 'GET',
    url: '/race/:id/export',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }

      const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, {
        projection: {
          "regCategories": 1, "registeredRacers": 1, 'eventDate': 1, 'eventDetails.name':1
        }
      })
      if (result) {
        let out = [];
        console.log(result.eventDate)
        result.registeredRacers.forEach((racerObj) => {
          let cat = _.find(result.regCategories, { id: racerObj.category })
          let start = dayjs(`${dayjs(result.eventDate).format('YYYY-MM-DD')} ${cat.startTime}`).format('MM/DD/YY h:mm A');
          out.push(_.assign(racerObj, { category: cat.catdispname, start, eventName: result.eventDetails.name }));
        })
        const columns = [
          {'key':'eventName','header': 'Event',},
          {'key':'start','header': 'Start',},
          {'key':'category','header': 'Category',},
          {'key':'maxLaps','header': 'maxLaps',},
          {'key':'sponsor','header': 'Team',},
          {'key':'bibNumber','header': 'Bibs',},
          {'key':'first_name','header': 'First',},
          {'key':'last_name','header': 'Last'},
          {'Relay':	'relay'},
          {'Penalties':'penalties'	},
          {'DNF':'dnf'}
        ]
        let csvData = stringify(_.sortBy(out, ['category','last_name']), {columns, header:true});
        // return _.sortBy(out, ['category','last_name'])
        return reply.header('Content-disposition', `attachment; filename=${request.params.id}.csv`).type('text/csv').send(csvData);
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  // fastify.get('/', async function (request, reply) {
  //   const cursor = this.mongo.db.collection('racers').find().sort({eventStart:1})

  //   return await cursor.toArray();
  // })
  // fastify.post('/fixup/:name', async function (request, reply) {
  //     const cursor = this.mongo.db.collection('racers').find({Name:request.params.name})
  //     const racerList = await cursor.toArray();
  //     racerList.forEach(async (racer, idx, coll)=>{
  //         if(racer.Name !== capitalizeName(racer.Name)){
  //           console.log(`${racer.Name}   ${capitalizeName(racer.Name)}`);
  //           await this.mongo.db.collection('racers').updateOne({ '_id': racer._id }, { $set: { Name: capitalizeName(racer.Name)} }, { upsert: true });
  //         }
  //     })
  //     return racerList;
  //   })
  // fastify.post('/fixup', async function (request, reply) {
  //   const cursor = this.mongo.db.collection('racers').find()
  //   const racerList = await cursor.toArray();
  //   racerList.forEach(async (racer, idx, coll)=>{
  //       if(racer.Name !== capitalizeName(racer.Name)){
  //         console.log(`${racer.Name}   ${capitalizeName(racer.Name)}`);
  //         await this.mongo.db.collection('racers').updateOne({ '_id': racer._id }, { $set: { Name: capitalizeName(racer.Name)} }, { upsert: true });
  //       }
  //   })
  //   return racerList;
  // })
  // fastify.patch('/:name', async function (request, reply) {
  //     const result = await this.mongo.db.collection('racers').findOne({Name:request.params.name});
  //     const data = request.body || {};
  //     let updateData = {};
  //     if(data.Birthdate){
  //         updateData.Birthdate = dayjs(data.Birthdate).toString();
  //     }
  //     if(data.Sponsor){
  //         updateData.Sponsor = data.Sponsor;
  //     }
  //     if (result && Object.keys(updateData).length) {
  //         await this.mongo.db.collection('racers').updateOne({ '_id': result._id }, { $set: updateData  }, { upsert: true });
  //         return updateData;
  //     } else {
  //         return fastify.httpErrors.notFound();
  //     }
  //   });
  fastify.get('/:name', async function (request, reply) {
    const result = await this.mongo.db.collection('racers').findOne({ Name: request.params.name });
    if (result) {
      return result;
    } else {
      return fastify.httpErrors.notFound();
    }
  });
  fastify.patch('/tsv', async function (request, reply) {
    if (request.query.token !== process.env.UPLOAD_TOKEN) {
      throw fastify.httpErrors.unauthorized();
    }

    let updated = {};

    let racers = request.body.split("\n");
    racers.forEach((row) => {
      let cols = row.split("\t");
      let birthday = dayjs(cols[3]);
      let entry = {
        Name: `${cols[0]} ${cols[1]}`,
        Birthdate: birthday.toString()
      }
      updated[entry.Name] = entry;
    })
    Object.keys(updated).forEach(async (racerName) => {
      let entry = updated[racerName];
      await this.mongo.db.collection('racers').updateOne({ 'Name': entry.Name }, { $set: entry }, { upsert: true });
    })

    // await mongo.db.collection('racers').updateOne({ 'Name': racer.Name }, { $set: racer }, { upsert: true });
    return updated;

  });
}