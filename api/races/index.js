'use strict'
const { result } = require('lodash');
const _ = require('lodash');


module.exports = async function (fastify, opts) {
  fastify.get('/', async function (request, reply) {
    const cursor = this.mongo.db.collection('races').find({active:true}).sort({eventStart:1})

    return await cursor.toArray();
  })
  fastify.get('/results/:id', async function (request, reply) {
    const result = await this.mongo.db.collection('race_results').findOne({raceid:request.params.id});
    if (result) {
        return result;
    } else {
        return fastify.httpErrors.notFound();
    }
  });

    fastify.post('/load_sponsors/', async function (request, reply) {
        console.log(request.query.srcid)
        const srcRace = await this.mongo.db.collection('race_results').findOne({ raceid: request.query.srcid });
        if (!srcRace) {
            return fastify.httpErrors.notFound();
        } else {
            let updated = {};
            Object.keys(srcRace.categories).forEach((catId) => {
                let category = srcRace.categories[catId];
                if (!category) {
                    console.log(`not category resultable? ${catId}`);
                    return;
                }
                category.results.forEach(async (resultData) => {
                    let racer = {
                        Name: resultData.Name
                    }
                    if (resultData.Sponsor && resultData.Sponsor.length > 0) {
                        racer.Sponsor = resultData.Sponsor;
                        updated[racer.Name] = racer.Sponsor;
                    }
                    await mongo.db.collection('racers').updateOne({ 'Name': racer.Name }, { $set: racer }, { upsert: true });
                })
            })
            return updated;
        }
    });

  fastify.post('/sync_sponsors/', async function (request, reply) {
      console.log(request.query.destid)
    const racersCursor = await this.mongo.db.collection('racers').find();
    const destRace = await this.mongo.db.collection('race_results').findOne({raceid:request.query.destid});
    if (!destRace) {
        return fastify.httpErrors.notFound();
    } else {
        let racersArray = await racersCursor.toArray();
        let changes = {};
        Object.keys(destRace.categories).forEach((catId)=>{
            let category = destRace.categories[catId];
            if(!category){
                console.log(`not category resultable? ${catId}`);
                return;
            }
            category.results.forEach(async (resultData,idx)=>{
                // console.log(`${resultData.Name}: ${resultData.Sponsor}: len ${resultData.Sponsor.length}`)
                if(!resultData.Sponsor || resultData.Sponsor.length === 0){
                    console.log(`racer without sponsor: ${resultData.Name}`)
                    let racer = racersArray.filter((elem)=>elem.Name === resultData.Name && elem.Sponsor && elem.Sponsor.length > 0);
                    if(racer.length > 0){
                        if(racer.length >1){
                            console.log("found multiple racer entries")
                            racer.forEach((elem)=>{
                                console.log(elem)
                            })
                        }else{
                            _.set(destRace, `${catId}.results[${idx}].Sponsor`, racer[0].Sponsor)
                            _.set(changes, `${catId}.results[${idx}].Sponsor`, racer[0].Sponsor)
                            _.set(changes, `${catId}.results[${idx}].Name`, racer[0].Name)
                        }
                    }
                    else{
                        console.log(`no maching racer sponsor entry: ${resultData.Name}`)
                    }
                }
                
            })
        })
        this.mongo.db.collection("race_results")
        .updateOne({ 'raceid': destRace.raceid }, { $set: { categories: destRace.categories } }, {upsert: true});
        return reply.send({ changes});
    }
  })

  

  fastify.get('/live', async function (request, reply) {
    
    
    const collection = db.collection('liveresults');
    const changeStream = collection.watch([], { fullDocument: 'updateLookup' });
    changeStream.on('change', next => {
       console.log(next);
    });
    
    
    
    const result = await this.mongo.db.collection('race_results').findOne({raceid:request.params.id});
    if (result) {
        return result;
    } else {
        return fastify.httpErrors.notFound();
    }
  })
}


