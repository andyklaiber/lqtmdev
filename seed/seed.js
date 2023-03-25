require('dotenv').config({ debug:true })
const MongoClient = require("mongodb").MongoClient;
const { url, db_name } = require('../src/db.config');

// Race data
const pcrs = require('./pcrs_test.json');
const flan = require('./flannel_grinder.json');
const nevada = require('./nevada_city_enduro.json');

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

        // Seed Organizations
        const orgsCollection = client.db(db_name).collection('organizations');
        const orgs = [{
            name: "BikeNerd"
        },{
            name: "CalBearAdventure"
        }]
        const insertManyresult = await orgsCollection.insertMany(orgs);
        let ids = insertManyresult.insertedIds;
        console.log("Inserted IDS: " + ids);

        // Seed Admins
        const adminsCollection = client.db(db_name).collection('administrators');
        await adminsCollection.createIndex({ username: 1 }, { unique: true });
        adminsCollection.insertMany([{
            username: "andy",
            email: "andy@eklaiber.com",
            password: "test",
            userType: "SUPER",
            organizations:[]
        },
        {
            username: "jeff",
            email: "jclaybaugh@yahoo.com",
            password: "test",
            userType: "SUPER",
            organizations:[]
        },
        {
            username: "nate",
            email: "andy.klaiber+testing@gmail.com",
            password: "test",
            userType: "PROMOTER",
            organizations:[...Object.values(ids)]
        }])
        
        // Seed Races
        const racesCollection = client.db(db_name).collection('races');
        await racesCollection.insertMany([flan, pcrs, nevada]);

        console.log("Database seeded! :)");
        client.close();
    } catch (err) {
        console.log(err.stack);
        process.exit(1);
    }
}

seedDB();