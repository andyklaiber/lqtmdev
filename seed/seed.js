require('dotenv').config({ debug:true })
const MongoClient = require("mongodb").MongoClient;
const { url, db_name } = require('../src/db.config');
const pcrs = require('./pcrs_test.json');
const pcrsResult = require('./pcrs_result.json');
const flan = require('./flannel_grinder.json');
const fs = require('fs');
const path = require('path');


async function seedDB() {
    if(url.indexOf('local') == -1){
        throw new Error('Dont seed production');
    }
    const client = new MongoClient(url, {
        useNewUrlParser: true,
        // useUnifiedTopology: true,
    });

    try {
        await client.connect();
        console.log("Connected correctly to server");

        // const orgsCollection = client.db(db_name).collection('administrators');
        // const orgs = [{
        //     name: "BikeNerd"
        // },{
        //     name: "CalBearAdventure"
        // }]
        // const insertManyresult = await orgsCollection.insertMany(orgs);
        // let ids = insertManyresult.insertedIds;
        // const adminsCollection = client.db(db_name).collection('administrators');
        // const result = await adminsCollection.createIndex({ username: 1 }, { unique: true });
        // const admins = [{
        //     username: "andy",
        //     email: "andy@eklaiber.com",
        //     password: "test",
        //     userType: "SUPER",
        //     organizations:[]
        // },
        // {
        //     username: "nate",
        //     email: "andy.klaiber+testing@gmail.com",
        //     password: "test",
        //     userType: "PROMOTER",
        //     organizations:[...Object.values(ids)]
        // }]
        
        const collection = client.db(db_name).collection('race_results');
        // pcrs.raceid = 'pcrs_2023_test_2'
        // pcrs["seriesRaceNumber"]= "2"
        // await collection.insertOne(pcrs);
        // pcrs.raceid = 'pcrs_2023_test_3'
        // pcrs["seriesRaceNumber"]= "3"
        pcrsResult.raceid = "sadfkjhadklnjcwei"
        await collection.insertOne(pcrsResult);
        // await collection.insertOne(flan);

        console.log("Database seeded! :)");
        client.close();
    }

    catch (err) {
        console.log(err.stack);
        client.close();
    }

}

async function seedSeries(seriesName) {
    if(url.indexOf('local') == -1){
        throw new Error('Dont seed production');
    }
    
    const client = new MongoClient(url, {
        useNewUrlParser: true,
    });

    try {
        await client.connect();
        console.log("Connected correctly to server");

        const seriesPath = path.join(__dirname, 'series', `${seriesName}.json`);
        const racesPath = path.join(__dirname, 'series', seriesName, 'regdata.races.json');
        
        // Check if files exist
        if (!fs.existsSync(seriesPath)) {
            throw new Error(`Series file not found: ${seriesPath}`);
        }
        if (!fs.existsSync(racesPath)) {
            throw new Error(`Races file not found: ${racesPath}`);
        }

        // Read the series and races data
        const seriesData = JSON.parse(fs.readFileSync(seriesPath, 'utf8'));
        const racesData = JSON.parse(fs.readFileSync(racesPath, 'utf8'));

        // Remove MongoDB _id from series if it exists (let MongoDB generate a new one)
        if (seriesData._id) {
            delete seriesData._id;
        }

        // Insert the series
        const seriesCollection = client.db(db_name).collection('series');
        const seriesResult = await seriesCollection.insertOne(seriesData);
        console.log(`✓ Inserted series: ${seriesData.name} (${seriesData.seriesId})`);

        // Process and insert races
        const racesCollection = client.db(db_name).collection('races');
        const racesToInsert = racesData.map(race => {
            // Remove MongoDB _id if it exists
            if (race._id) {
                delete race._id;
            }
            // Set isTestData to true
            race.isTestData = true;
            return race;
        });

        if (racesToInsert.length > 0) {
            const racesResult = await racesCollection.insertMany(racesToInsert);
            console.log(`✓ Inserted ${racesToInsert.length} races with isTestData=true`);
            racesToInsert.forEach(race => {
                console.log(`  - ${race.displayName} (${race.raceid})`);
            });
        } else {
            console.log('No races to insert');
        }

        console.log("\nSeries and races seeded successfully! :)");
        client.close();
    }

    catch (err) {
        console.log(err.stack);
        client.close();
    }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args[0] === '--series' && args[1]) {
    seedSeries(args[1]);
} else if (args[0] === '--series') {
    console.error('Error: Please specify a series name');
    console.log('Usage: node seed.js --series <series_name>');
    console.log('Example: node seed.js --series bear_offroad_2026');
    process.exit(1);
} else {
    seedDB();
}