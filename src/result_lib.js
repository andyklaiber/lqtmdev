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
    let minSecMillis=parts.map(s => String(s).padStart(2,'0')).join(':');//.concat(`.${d.getUTCMilliseconds()}`)
    if(d.getUTCHours()){
        minSecMillis = d.getUTCHours() + ":" +minSecMillis;
    }
    return minSecMillis;
}

const parensRegexp = new RegExp(/\(+|\)+/ig);
const capitalizeName = (nameString)=>{
    let parts = nameString.split(' ');
    _.forEach(parts, (part, id, collection)=>{
        if(part.length === 2) return;
        if(part.match(parensRegexp)) return;
        if(part[1] === "'"){
            let lastName = _.capitalize(part)
            lastName = lastName.slice(0,2) + lastName.charAt(2).toUpperCase() + lastName.slice(3)
            collection[id] = lastName;
        }else{
            if(part.indexOf("-") > -1){
                let dashIdx = part.indexOf("-") + 1;
                let lastName = _.capitalize(part)
                collection[id] = lastName.slice(0,dashIdx) + lastName.charAt(dashIdx).toUpperCase() + lastName.slice(dashIdx+1)
                
            }else{

                collection[id] = _.capitalize(part)
            }
        }
    });
    return parts.join(' ');
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
        const racername = capitalizeName(racerLap.racername);
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
        if(!out.categories[racerLap.cat].results[racername]){
            out.categories[racerLap.cat].results[racername] = {
                Name: racername,
                Sponsor: racerLap.teamname,
                Bib: racerLap.lapbib,
                laps: [lap],
                Time:null
            };
        }else{
            out.categories[racerLap.cat].results[racername].laps.push(lap);
        }

        
        
        let totalTime = 0;
        if(out.categories[racerLap.cat].results[racername]){
            out.categories[racerLap.cat].results[racername].laps.forEach((lapdata)=>{
                totalTime = totalTime + lapdata.duration;
            })
            out.categories[racerLap.cat].results[racername].duration = totalTime;
            out.categories[racerLap.cat].results[racername].Time = msToTimeString(totalTime);
        }
        else{
            console.log("not found!!!!", racerLap.racername);
        }
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


const getSeriesColumns = (raceMeta, catId)=>{
    let cols = ["Pos","Bib","Name","Age","Sponsor"]
    for (let i = 0; i < raceMeta.length; i++) {
        const race = raceMeta[i];
        if(catId.indexOf('grom') == -1){
            cols.push(`${race.formattedStartDate}`);
        }
        else{
            if(i > 2){
                cols.push(`${race.formattedStartDate}`);
            }

        }
    }
    return cols.concat(["Total Points"])
}

const generateSeriesResults = (raceResults, racesMeta, racersMeta, categoryOrder, teamsRacers)=>{
    let out = {
        categories:{
        }
    }

    const bibList = [];
    const dupBibs = [];
    const teamPoints = [];

    raceResults.forEach((race) =>{
        let thisRaceMeta = racesMeta.find((obj)=>obj.raceid === race.raceid);
        Object.keys(race.categories).forEach((catId)=>{
            if(catId == 'poker_league'){
                return;
            }
            const catMeta = race.categories[catId];
            if(!out.categories[catId]){
                out.categories[catId] = {
                    id: catMeta.id,
                    catdispname: catMeta.catdispname,
                    laps: catMeta.laps,
                    columns: getSeriesColumns(racesMeta, catMeta.id),
                    results:{},
                    disporder:categoryOrder.indexOf(catMeta.id)
                }
            }
            const catResults = race.categories[catId].results;
            
            // add racer result pos to results object
            catResults.forEach((racerRow, idx)=>{
                const racerName = capitalizeName(racerRow.Name);
                if(!out.categories[catId].results[racerName]){
                    out.categories[catId].results[racerName] = {
                    Name: racerRow.Name,
                    Bib: racerRow.Bib,
                    finishes:[]
                    }
                }
                out.categories[catId].results[racerName].Bib = racerRow.Bib;
                out.categories[catId].results[racerName].finishes.push({
                    raceDate: thisRaceMeta.formattedStartDate,
                    position: idx+1,
                    points: 50-idx
                })
                if(racerRow.Sponsor && racerRow.Sponsor.length > 0){
                    out.categories[catId].results[racerName].Sponsor = racerRow.Sponsor;
                }
            })
        })
        
    })

    Object.keys(out.categories).forEach((catId)=>{
        const catMeta = out.categories[catId];

        let catResults = [];
        if(catMeta.results){
            Object.entries(catMeta.results).forEach(([racerName,data])=>{
                let existingBib = _.find(bibList, data.Bib);
                if(!existingBib){
                    bibList.push(data.Bib);
                }
                else{
                    dupBibs.push(data.Bib);
                }
                let racerSeriesRow = {
                    "Bib":data.Bib,
                    "Name": racerName,
                    "Sponsor": data.Sponsor,
                    results: [],
                    seriesPoints: 0
                }
                let racerTeamComp = _.find(teamsRacers, (meta)=>{
                    if(capitalizeName(meta.Name) === capitalizeName(racerName)) {
                        return true;
                    }
                })
                let racerMetaInfo = _.find(racersMeta, (meta)=>{
                        if(capitalizeName(meta.Name) === capitalizeName(racerName)) {
                            return true;
                        }
                    })
                if (racerMetaInfo && racerMetaInfo.Birthdate){
                    let bday
                    try{
                        bday = moment(racerMetaInfo.Birthdate)
                    } catch(error){
                        console.log(`bad birthday string: ${racerName} - ${racerMetaInfo.Birthdate}`);
                    }
                    racerSeriesRow.Age = moment().diff(bday, 'years');
                }
                if (racerMetaInfo && racerMetaInfo.Sponsor){
                    racerSeriesRow.Sponsor = racerMetaInfo.Sponsor;
                }
                const racerFinishes = out.categories[catId].results[racerName].finishes;
                // for each race date, add either an entry with points, or -/- to indicate they didn't race
                racesMeta.forEach((race)=>{
                    const raceFinish = _.find(racerFinishes, {raceDate:race.formattedStartDate});
                    let resultString = "-/-";
                    let finishPoints = 0;
                    if(raceFinish){
                        finishPoints = raceFinish.points;
                        resultString = `${raceFinish.position}/${raceFinish.points}`;
                    }
                    if(catId.indexOf('grom') == -1){
                        racerSeriesRow.results.push({raceDate: race.formattedStartDate, resultString, finishPoints });
                    }
                    else{
                        if(["4/13","4/20","4/27","5/4","5/11"].indexOf(race.formattedStartDate) > -1){
                            racerSeriesRow.results.push({raceDate: race.formattedStartDate, resultString, finishPoints });
                        }
                    }
                    if(racerTeamComp){
                        console.log("++++ Team Racer: ", racerTeamComp.Name)
                        // team points competition
                        if(raceFinish && ["5/4","5/11","5/18","5/25"].indexOf(race.formattedStartDate) > -1){
                            console.log(race.formattedStartDate, raceFinish.points);
                            racerTeamComp[race.formattedStartDate] = raceFinish.points;
                        }
                        else{
                            console.log("No Race Result: ", race.formattedStartDate);
                        }
                    }
                })
                let orderedByPoints = _.orderBy(racerSeriesRow.results, 'finishPoints', 'asc');
                if(catId.indexOf('grom') == -1){
                    // drop 2 out of 10 for general categories
                    if(orderedByPoints.length >= 9){
                        let drop1 = _.findIndex(racerSeriesRow.results, (result)=>orderedByPoints[0].raceDate === result.raceDate)
                        racerSeriesRow.results[drop1].dropped = true;
                    }
                    if(orderedByPoints.length >= 10){
                        let drop2 = _.findIndex(racerSeriesRow.results, (result)=>orderedByPoints[1].raceDate === result.raceDate)
                        racerSeriesRow.results[drop2].dropped = true;
                    }
                }else{
                    // drop 1 race for groms
                    if(orderedByPoints.length >= 5){
                        let drop1 = _.findIndex(racerSeriesRow.results, (result)=>orderedByPoints[0].raceDate === result.raceDate)
                        racerSeriesRow.results[drop1].dropped = true;
                    }
                }

                racerSeriesRow.seriesPoints = _.reduce(racerSeriesRow.results, (sum, result)=>{
                    if(result.dropped){
                        return sum;
                    }
                    return sum + result.finishPoints;
                }, 0)
                catResults.push(racerSeriesRow);
                if(racerTeamComp){
                    teamPoints.push(racerTeamComp);
                }
            })

            catResults = _.sortBy(catResults, 'seriesPoints');
            _.reverse(catResults);
            out.categories[catId].results = catResults;
        }
    })
    out.dupBibs = dupBibs;
    out.bibList = _.sortBy(bibList);
    return { seriesResults: out, teamPoints };
}

const moveRacerInResult = (raceResults, racerName, newCategory)=>{
    let srcCategory, result;
    Object.entries(raceResults.categories).some(([key, value])=>{
        let rawResults = value.results;
        
        result = _.find(rawResults, {Name: racerName});
        if(result){
            srcCategory = key;
            _.pull(rawResults, result);
            return true;
        }
        return;
    })
    let ordered
    if(raceResults.categories[newCategory]){
        ordered = raceResults.categories[newCategory].results;
        ordered.push(result);

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
            if(result.laps.length === ordered[0].laps.length){   
                ordered[idx].back = msToTimeString(racer.duration - ordered[0].duration);
            }
        })
        raceResults.categories[newCategory].results = ordered;
    }
    else{
        throw new Error('category does not exist in this result set');
    }

    return raceResults;
}

module.exports = {
    generateResultData,
    generateSeriesResults,
    moveRacerInResult,
    capitalizeName,
}