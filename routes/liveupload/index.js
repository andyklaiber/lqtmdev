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
                    id: racerLap.cat,
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
                    Name: racerLap.racername,
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
            out.categories[racerLap.cat].results[racerLap.racername].duration = totalTime;
            out.categories[racerLap.cat].results[racerLap.racername].Time = msToTimeString(totalTime);
        })

        Object.entries(out.categories).forEach(([key, value])=>{
            let rawResults = value.results;
            let ordered = []
            Object.entries(rawResults).forEach(([racerName,racerData])=>{
                ordered.push(racerData);
            })
            
            ordered = ordered.sort((a,b)=>{
                if(a.duration > b.duration){
                    return 1;
                }
                if(a.duration < b.duration){
                    return -1;
                }
                return 0;
            })
            ordered = ordered.sort((a,b)=>{
                if(a.laps.length < b.laps.length){
                    return 1;
                }
                if(a.laps.length > b.laps.length){
                    return -1;
                }
                return 0;
            })
            ordered.forEach((racer,idx)=>{
                if(idx === 0){
                    return;
                }
                if(racer.laps.length === ordered[0].laps.length){   
                    ordered[idx].back = msToTimeString(racer.duration - ordered[0].duration);
                }
            })
            
            out.categories[key].results = ordered;

        })
        
        fs.writeFileSync(path.resolve(__dirname, '../../public/data/'+rawFileName+'.json'), JSON.stringify(out));
        fs.writeFileSync(path.resolve(__dirname, '../../public/data/'+rawFileName+'-RAW.json'), JSON.stringify(request.body.data));
        

        return out;
    }
  })
}
