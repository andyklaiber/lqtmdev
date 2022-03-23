'use strict'
const fs = require('fs');
const path = require('path');

let msToTimeString = (ms)=>{
    const d = new Date(Date.UTC(0,0,0,0,0,0,ms)),
    parts = [
        d.getUTCMinutes(),
        d.getUTCSeconds()
    ]
    return parts.map(s => String(s).padStart(2,'0')).join(':')
}


module.exports = async function (fastify, opts) {
  fastify.post('/', async function (request, reply) {
    if(request.query.token !== process.env.UPLOAD_TOKEN){
        throw fastify.httpErrors.unauthorized();
    } else {
        let rawFileName = request.query.f;

        let raceMeta = request.body.data.race;
        let results = request.body.data.RESULTS;

        let out = {
            categories:{
            }
        }
        let getColumns = (maxLaps)=>{
            let cols = ["Pos","Bib","Name","Sponsor"]
            for (let i = 1; i <= maxLaps; i++) {
                cols.push(`Lap ${i}`);
            }
            return cols.concat(["Time", "Back"])
        }

        results.forEach((racerLap) =>{
            if(racerLap.cat === 'uncategorized'){
                return;
            }
            if(!out.categories[racerLap.cat]){
                out.categories[racerLap.cat] = {
                    catdispname: racerLap.catdispname,
                    laps: racerLap.catmaxlaps,
                    columns: getColumns(racerLap.catmaxlaps),
                    results:{},
                };
            }
            let lap = {
                    lap: racerLap.lap,
                    duration: racerLap.lapduration,
                    timeString: msToTimeString(racerLap.lapduration),
                    //lapendtime: racerLap.lapendtime,
                    //lapstarttime: racerLap.lapstarttime
            }
            if(!out.categories[racerLap.cat].results[racerLap.racername]){
                out.categories[racerLap.cat].results[racerLap.racername] = {
                    Sponsor: racerLap.teamname,
                    Bib: racerLap.lapbib,
                    laps: [lap],
                    Time:null
                };
            }else{
                out.categories[racerLap.cat].results[racerLap.racername].laps.push(lap);
            }

            
            
            let totalTime = 0;
            out.categories[racerLap.cat].results[racerLap.racername].laps.forEach((lapdata)=>{
                totalTime = totalTime + lapdata.duration;
            })
            out.categories[racerLap.cat].results[racerLap.racername].Time = msToTimeString(totalTime);
        })
        
        fs.writeFileSync(path.resolve(__dirname, '../../public/data/'+rawFileName+'.json'), JSON.stringify(out));


        return out;
    }
  })
}
