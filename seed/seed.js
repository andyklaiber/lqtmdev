require('dotenv').config({ debug:true })
const MongoClient = require("mongodb").MongoClient;
const { url, db_name } = require('../src/db.config');
const pcrs = require('./pcrs_test.json');
const pcrsResult = require('./pcrs_result.json');
const flan = require('./flannel_grinder.json');


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

seedDB();