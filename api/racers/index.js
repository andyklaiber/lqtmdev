const { update } = require('lodash');
const _ = require('lodash');
const moment = require('moment');

module.exports = async function (fastify, opts) {
    // fastify.get('/', async function (request, reply) {
    //   const cursor = this.mongo.db.collection('racers').find().sort({eventStart:1})
  
    //   return await cursor.toArray();
    // })
    // fastify.get('/:name', async function (request, reply) {
    //   const result = await this.mongo.db.collection('racers').findOne({Name:request.params.name});
    //   if (result) {
    //       return result;
    //   } else {
    //       return fastify.httpErrors.notFound();
    //   }
    // });
  
      fastify.patch('/tsv', async function (request, reply) {
          if(request.query.token !== process.env.UPLOAD_TOKEN){
              throw fastify.httpErrors.unauthorized();
          }
          
          let updated = {};  

          let racers = request.body.split("\n");
          racers.forEach((row)=>{
            let cols = row.split("\t");
            let birthday = moment(cols[3]);
            let entry = {
                Name: `${cols[0]} ${cols[1]}`,
                Birthdate: birthday.toString()
            }
            updated[entry.Name] = entry;
          })
          Object.keys(updated).forEach(async (racerName)=>{
            let entry = updated[racerName];
            await this.mongo.db.collection('racers').updateOne({ 'Name': entry.Name }, { $set: entry }, { upsert: true });
          })
          
                     // await mongo.db.collection('racers').updateOne({ 'Name': racer.Name }, { $set: racer }, { upsert: true });
        return updated;
          
      });
    }