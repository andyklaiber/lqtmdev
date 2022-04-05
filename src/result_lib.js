const _ = require('lodash');
const moment = require('moment');

const getColumns = (maxLaps)=>{
    let cols = ["Pos","Bib","Name","Sponsor"]
    for (let i = 1; i <= maxLaps; i++) {
        cols.push(`Lap ${i}`);
    }
    return cols.concat(["Time", "Back"])
}

let msToTimeString = (ms)=>{
    const d = new Date(Date.UTC(0,0,0,0,0,0,ms)),
    parts = [
        d.getUTCMinutes(),
        d.getUTCSeconds()
    ]
    return parts.map(s => String(s).padStart(2,'0')).join(':')
}

const generateResultData = (results, categoryOrder)=>{
    let out = {
        categories:{
        }
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
                disporder:categoryOrder.indexOf(racerLap.cat)
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
    return out;
}


const getSeriesColumns = (raceMeta)=>{
    let cols = ["Pos","Bib","Name","Age","Sponsor"]
    for (let i = 0; i < raceMeta.length; i++) {
        const race = raceMeta[i];
        cols.push(`${race.formattedStartDate}`);
    }
    return cols.concat(["Total Points"])
}

const generateSeriesResults = (raceResults, racesMeta, racersMeta, categoryOrder)=>{
    let out = {
        series:raceResults[0].series,
        categories:{
        }
    }


    raceResults.forEach((race) =>{
        let thisRaceMeta = racesMeta.find((obj)=>obj.raceid === race.raceid);
        Object.keys(race.categories).forEach((catId)=>{
            const catMeta = race.categories[catId];
            if(!out.categories[catId]){
                out.categories[catId] = {
                    id: catMeta.id,
                    catdispname: catMeta.catdispname,
                    laps: catMeta.laps,
                    columns: getSeriesColumns(racesMeta),
                    results:{},
                    disporder:categoryOrder.indexOf(catMeta.id)
                }
            }
            const catResults = race.categories[catId].results;
            
            // add racer result pos to results object
            catResults.forEach((racerRow, idx)=>{
                if(!out.categories[catId].results[racerRow.Name]){
                    out.categories[catId].results[racerRow.Name] = {
                    Name: racerRow.Name,
                    Bib: racerRow.Bib,
                    finishes:[]
                    }
                }
                out.categories[catId].results[racerRow.Name].finishes.push({
                    raceDate: thisRaceMeta.formattedStartDate,
                    position: idx+1,
                    points: 50-idx
                })
                if(racerRow.Sponsor && racerRow.Sponsor.length > 0){
                    out.categories[catId].results[racerRow.Name].Sponsor = racerRow.Sponsor;
                }
            })
        })
        
    })

    Object.keys(out.categories).forEach((catId)=>{
        const catMeta = out.categories[catId];

        let catResults = [];
        if(catMeta.results){
            Object.entries(catMeta.results).forEach(([racerName,data])=>{
                let racerSeriesRow = {
                    "Bib":data.Bib,
                    "Name": racerName,
                    "Sponsor": data.Sponsor,
                    results: [],
                    seriesPoints: 0
                }
                let racerMetaInfo = _.find(racersMeta, { Name: racerName })
                if (racerMetaInfo && racerMetaInfo.Birthdate){
                    let bday
                    try{
                        bday = moment(racerMetaInfo.Birthdate)
                    } catch(error){
                        console.log(`bad birthday string: ${racerName} - ${racerMetaInfo.Birthdate}`);
                    }
                    racerSeriesRow.Age = moment().diff(bday, 'years');
                }
                const racerFinishes = out.categories[catId].results[racerName].finishes;
                // for each race date, add either an entry with points, or -/- to indicate they didn't race
                racesMeta.forEach((race)=>{
                    const raceFinish = _.find(racerFinishes, {raceDate:race.formattedStartDate});
                    let resultString = "-/-";
                    if(raceFinish){
                        racerSeriesRow.seriesPoints += raceFinish.points;
                        resultString = `${raceFinish.position}/${raceFinish.points}`;
                    }
                    racerSeriesRow.results.push({raceDate: race.formattedStartDate, resultString });
                })
                catResults.push(racerSeriesRow);
            })

            catResults = _.sortBy(catResults, 'seriesPoints');
            _.reverse(catResults);
            out.categories[catId].results = catResults;
        }
    })
    return out;
}

module.exports = {
    generateResultData,
    generateSeriesResults
}