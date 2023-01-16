require('dotenv').config({ debug:true })
const MongoClient = require("mongodb").MongoClient;
const { url, db_name } = require('../src/db.config');
const pcrs = require('./pcrs_test.json');

async function seedDB() {
    const client = new MongoClient(url, {
        useNewUrlParser: true,
        // useUnifiedTopology: true,
    });

    try {
        await client.connect();
        console.log("Connected correctly to server");

        const collection = client.db(db_name).collection('races');
        await collection.insertOne(pcrs);

        console.log("Database seeded! :)");
        client.close();
    }

    catch (err) {
        console.log(err.stack);
    }

}

seedDB();