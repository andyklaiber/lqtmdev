const _ = require('lodash');
const teamDates = ["5/4","5/11","5/18","5/25"];

const roundToTwo = (num) => {
    return +(Math.round(num + "e+2")  + "e-2");
    }

module.exports = async function (fastify, opts) {
    fastify.get('/', async function (request, reply) {
        const series_data = await this.mongo.db.collection('series_results').findOne({ series: request.query.series });
        const cursor = this.mongo.db.collection('team_comp').find({ Series: request.query.series })

        let result = await cursor.toArray();

        if (result.length) {
            let teamDets = _.groupBy(result, 'Team');
            let teamScores = {};
            _.forEach(teamDets,(team, teamName)=>{
                let teamCount = team.length;
                teamScores[teamName] = {
                    teamName,
                    count: teamCount,
                    totalPoints: 0
                }

                series_data.teamCompDates.forEach((date)=>{
                    let datePoints = 0;
                    team.forEach((teamMember)=>{
                        if(teamMember[date]){
                            datePoints += teamMember[date];
                        }
                    })
                    if(datePoints > 0){
                        let dateScore = datePoints/teamCount
                        dateScore = roundToTwo(dateScore);
                        if(!teamScores[teamName].results){
                            teamScores[teamName].results = {};
                        }
                        teamScores[teamName].totalPoints += datePoints;
                        teamScores[teamName].results[date] = { points: datePoints, avg: dateScore };
                    }
                })
                teamScores[teamName].totalScore = roundToTwo(teamScores[teamName].totalPoints / teamScores[teamName].count);
            })
            return { teamCompDates:series_data.teamCompDates, teamDets, result:  _.orderBy(teamScores, 'totalScore', 'desc') }
        } else {
            return fastify.httpErrors.notFound();
        }
    })
    fastify.get('/racers/', async function (request, reply) {
        const cursor = this.mongo.db.collection('team_comp').find({ Series: request.query.series }).toArray();
        return cursor;
    })
    fastify.route({
        method: 'POST',
        url: '/racers/',
        preHandler: fastify.auth([fastify.verifyAdminSession]),
        handler: async function (request, reply) {
          const racerData = request.body;
          const { series } = request.query;
          console.log(series);
          console.log(racerData);
          if(racerData.Sponsor && !racerData.Team){
            racerData.Team = racerData.Sponsor;
          }
          racerData.Series = series;
          return await this.mongo.db.collection('team_comp').updateOne({ 'Name': racerData.Name, 'Series': series }, { $set: racerData }, { upsert: true });
        }
    });
    // fastify.get('/:name', async function (request, reply) {
    //   const result = await this.mongo.db.collection('racers').findOne({Name:request.params.name});
    //   if (result) {
    //       return result;
    //   } else {
    //       return fastify.httpErrors.notFound();
    //   }
    // });
    fastify.patch('/tsv', async function (request, reply) {
        if (request.query.token !== process.env.UPLOAD_TOKEN) {
            throw fastify.httpErrors.unauthorized();
        }

        let updated = {};

        let racers = request.body.split("\n");
        racers.forEach((row) => {
            let cols = row.split("\t");
            let entry = {
                Name: `${cols[2]} ${cols[1]}`,
                Bib: cols[0],
                Cat: cols[3],
                Team: cols[4],
                Series: request.query.series
            }
            updated[entry.Name] = entry;
        })
        Object.keys(updated).forEach(async (racerName) => {
            let entry = updated[racerName];
            await this.mongo.db.collection('team_comp').updateOne({ 'Name': entry.Name }, { $set: entry }, { upsert: true });
        })

        // await mongo.db.collection('racers').updateOne({ 'Name': racer.Name }, { $set: racer }, { upsert: true });
        return updated;

    });
}