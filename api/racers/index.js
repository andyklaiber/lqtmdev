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
          displayName:1,"regCategories": 1, "paymentOptions": 1, "registeredRacers": 1, series:1
        }
      })
      const unpaid = await this.mongo.db.collection('payments').find(
        { 'regData.raceid': request.params.id, 'regData.paytype': 'cash', status: { $ne: 'paid' } },
        { projection: { regData: 1, _id: 1, status: 1 } }).toArray();
      if (result) {
        if (unpaid.length) {
          let reformatted = _.map(unpaid, (record) => {
            return _.assign({}, record.regData, { status: record.status, paymentId: record._id });
          })

          result.registeredRacers = [...result.registeredRacers, ...reformatted];
        }
        return result;
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  fastify.route({
  //get series single registrations for prev and current race
  method: 'GET',
  url: '/series/:id',
  preHandler: fastify.auth([fastify.verifyAdminSession]),
  handler: async function (request, reply) {
    if (!request.params.id) {
      return fastify.httpErrors.badRequest('You must provide a series ID');
    }

    //const {first_name, last_name} = request.body
    const result = await this.mongo.db.collection('races').find({ 'series': request.params.id }, {
      projection: {
        "regCategories": 1, 
        // "paymentOptions": 1, 
        "registeredRacers": 1, 
        eventDate:1, displayName:1, raceid:1, series:1
      }
    }).sort({eventDate: 1}).toArray();
    // const unpaid = await this.mongo.db.collection('payments').find(
    //   { 'regData.raceid': request.params.id, 'regData.paytype': 'cash', status: { $ne: 'paid' } },
    //   { projection: { regData: 1, _id: 1, status: 1 } }).toArray();
    if (result) {

      let today = dayjs();
      let prevIdx = 0;
      let filteredRaces = _.filter(result, ({ eventDate }, idx) => {
        if (dayjs(eventDate).isBefore(today.subtract(24, 'hour'))) {
          prevIdx = idx;
          console.log(dayjs(eventDate).format())
          console.log(today.format());
          return true;
        }
        return false;
      })
      console.log(prevIdx)
      filteredRaces.push(result[prevIdx + 1])
      let allracers = []
      filteredRaces.forEach(({registeredRacers, displayName, raceid})=>{
        registeredRacers.forEach((racer)=>{
          racer.eventDisplayName = displayName;
          racer.raceid = raceid
        })
        allracers = [...allracers, ...registeredRacers];
      })

      //get all single entries with a bib
        allracers = _.filter(allracers, (racer)=>{
          if(racer.bibNumber && (racer.paytype=='cash' || racer.paytype=='single')){
            return true
          }
        })
      
      // get all new (single) registrations without a bib 
      let newRegs = _.filter(filteredRaces[filteredRaces.length-1].registeredRacers, (racer)=>{
        if(!racer.bibNumber && (racer.paytype=='cash' || racer.paytype=='single')){
          return true
        }
      })


      let returnObj = {
        races: _.map(result, 'raceid'),
        regCategories: filteredRaces[filteredRaces.length-1].regCategories,
        racers: _.sortBy([...allracers, ...newRegs], 'last_name')
      }
      // if (unpaid.length) {
      //   let reformatted = _.map(unpaid, (record) => {
      //     return _.assign({}, record.regData, { status: record.status, paymentId: record._id });
      //   })

      //   returnObj.unpaid = reformatted;
      // }
      return returnObj;
    } else {
      return fastify.httpErrors.notFound();
    }
  }
})
  //get racer by bib number
  fastify.post('/bib', async function(request,reply){
    const {series, bibNumber} = request.body
    if (!bibNumber) {
      return fastify.httpErrors.badRequest('You must provide a bib number to look up');
    }
    let result = await fastify.findSeriesRacerByBib(bibNumber, series)
    if (result) {
      return _.omit(result, ['email']);
    } else {
      return fastify.httpErrors.notFound('Could not find previous entry with bib: '+bibNumber);
    }
})
  // authenticated bib lookup for admin site
  fastify.route({
    method: 'POST',
    url: '/bib/:bib',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      const bibNumber = request.params.bib;
      const { series } = request.body
      if (!bibNumber) {
        return fastify.httpErrors.badRequest('You must provide a bib number to look up');
      }
      let result = await fastify.findSeriesRacerByBib(bibNumber, series)
      if (result) {
        return result;
      } else {
        return fastify.httpErrors.notFound('Could not find previous entry with bib: ' + bibNumber);
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
      const payment = await this.mongo.db.collection('payments').findOne({ '_id': this.mongo.ObjectId(request.query.paymentId) }, {
        projection: {
          regData: 1,
          status: 1,
          sponsoredPayment: 1,
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
          if (_.includes(allowedFields, keyName)) {
            fieldsToSet[`registeredRacers.$.${keyName}`] = request.body[keyName];
          }
        })
        if (Object.keys(fieldsToSet).length < 1) {
          return fastify.httpErrors.badRequest('No valid fields provided for update');
        }
        //if part of a series, and paytype==season update all the series records?
        let updateResult;
        if (payment.regData.paytype === 'season') {
          const race = await this.mongo.db.collection('races').findOne({ 'raceid': payment.regData.raceid }, {
            projection: {
              series: 1
            }
          })
          updateResult = await this.mongo.db.collection('races').updateMany({
            'series': race.series,
            "registeredRacers.paymentId": this.mongo.ObjectId(request.query.paymentId)
          },
            { $set: fieldsToSet })
        }
        else {
          //if single race, just update the record for the 1 race
          updateResult = await this.mongo.db.collection('races').updateOne({
            'raceid': request.params.id,
            "registeredRacers.paymentId": this.mongo.ObjectId(request.query.paymentId)
          },
            { $set: fieldsToSet })

        }
        return updateResult;
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  fastify.route({
    method: 'DELETE',
    url: '/race/:id',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }
      if (!request.query.paymentId) {
        return fastify.httpErrors.badRequest('Registered racers must have a paymentID');
      }
      const payment = await this.mongo.db.collection('payments').findOne({ '_id': this.mongo.ObjectId(request.query.paymentId) }, {
        projection: {
          regData: 1,
          status: 1,
          sponsoredPayment: 1,
        }
      });

      if (payment) {
      
        //if part of a series, and paytype==season update all the series records?
        let deleteResult;
        if (payment.regData.paytype === 'season') {
          return fastify.httpErrors.badRequest('season delete not implemented yet');
        }
        else {
          //if single race, just delete 1 race
          deleteResult = await this.mongo.db.collection('races').updateOne({
            'raceid': request.params.id
          },
            { $pull: {registeredRacers: {paymentId: this.mongo.ObjectId(request.query.paymentId)} }})
            await this.mongo.db.collection('payments').updateOne({ '_id': this.mongo.ObjectId(request.query.paymentId) },
            {
              $set:{
                "regData.raceid": "",
              }
          });

        }
        return deleteResult;
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
          "regCategories": 1, "registeredRacers": 1, 'eventDate': 1, 'eventDetails.name': 1
        }
      })
      if (result) {
        let out = [];
        console.log(result.eventDate)
        result.registeredRacers.forEach((racerObj) => {
          let cat = _.find(result.regCategories, { id: racerObj.category })
          let start = dayjs(result.eventDate).format('MM/DD/YY h:mm A');
          if(cat.startTime){
            start = dayjs(`${dayjs(result.eventDate).format('YYYY-MM-DD')} ${cat.startTime}`).format('MM/DD/YY h:mm A');
          }
          out.push(_.assign(racerObj, { category: cat.catdispname, start, eventName: result.eventDetails.name }));
        })
        const columns = [
          { 'key': 'eventName', 'header': 'Event', },
          { 'key': 'start', 'header': 'Start', },
          { 'key': 'category', 'header': 'Category', },
          { 'key': 'maxLaps', 'header': 'maxLaps', },
          { 'key': 'sponsor', 'header': 'Team', },
          { 'key': 'bibNumber', 'header': 'Bibs', },
          { 'key': 'first_name', 'header': 'First', },
          { 'key': 'last_name', 'header': 'Last' },
          { 'key': 'Relay', 'header': 'relay' },
          { 'key': 'Penalties', 'header': 'penalties' },
          { 'key': 'DNF', 'header': 'dnf' }
        ]
        let csvData = stringify(_.sortBy(out, ['category', 'last_name']), { columns, header: true });
        // return _.sortBy(out, ['category','last_name'])
        return reply.header('Content-disposition', `attachment; filename=${request.params.id}.csv`).type('text/csv').send(csvData);
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  // export contacts csv
  fastify.route({
    method: 'GET',
    url: '/race/:id/export-contact',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }

      const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, {
        projection: {
          "regCategories": 1, "registeredRacers": 1, 'eventDate': 1, 'eventDetails.name': 1
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
          { 'key': 'last_name', 'header': 'Last' },
          { 'key': 'first_name', 'header': 'First', },
          { 'key': 'email', 'header': 'Email' },
          { 'key': 'category', 'header': 'Category', },
          { 'key': 'paytype', 'header': 'Payment Type', },
        ]
        let csvData = stringify(_.sortBy(out, ['last_name']), { columns, header: true });
        // return _.sortBy(out, ['category','last_name'])
        return reply.header('Content-disposition', `attachment; filename=${request.params.id}.csv`).type('text/csv').send(csvData);
      } else {
        return fastify.httpErrors.notFound();
      }
    }
  })
  fastify.route({
    method: 'GET',
    url: '/race/:id/exportjson',
    preHandler: fastify.auth([fastify.verifyAdminSession]),
    handler: async function (request, reply) {
      if (!request.params.id) {
        return fastify.httpErrors.badRequest('You must provide a race ID');
      }

      const result = await this.mongo.db.collection('races').findOne({ 'raceid': request.params.id }, {
        projection: {
          "regCategories": 1, "registeredRacers": 1, 'eventDate': 1, 'eventDetails.name': 1
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
        const jsonData = JSON.stringify(out);
        // return _.sortBy(out, ['category','last_name'])
        return reply.header('Content-disposition', `attachment; filename=${request.params.id}.json`).type('text/json').send(jsonData);
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