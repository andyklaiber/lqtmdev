require('dotenv').config({ debug:true })
const MongoClient = require("mongodb").MongoClient;
const { url, db_name } = require('../src/db.config');
const pcrs = require('./pcrs_test.json');
const flan = require('./flannel_grinder.json');


const codes = [
"47MMRECH",
"5K3ZEHSM",
"5XX3VEBH",
"7PU3NPRT",
"9BLA3VKH",
"9Z4UVXNF",
"AX7TFLS9",
"DLLBMX3D",
"DSZ92TQD",
"ESWAPTC3",
"EXPH85YA",
"EYA5XK5J",
"F8A3YU8S",
"FKWPJ72S",
"FSNLYBVT",
"K47Q2VW7",
"MWKJHLFN",
"PAUC5MTN",
"PJTUD9NC",
"QN557V3U",
"QZCWPMN4",
"R3P9MRNT",
"ST2MPBWZ",
"T73FKCSJ",
"TUW397TK",
"VKCU3HRF",
"WJM8VPAQ",
"WXNXWRTA",
"WY8S4DDC",
"XASL8B4W",
"XCB7YF45",
"ZF3WBFUJ",
// "TEST1",
// "TEST2",
// "TEST3"
]

flan.couponCodes = {};
codes.forEach((code)=>{
    flan.couponCodes[code] = {
        fractionDiscount: 1,
        singleUse: true
    }
})

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

        const adminUsers = client.db(db_name).collection('administrators');
        
        const collection = client.db(db_name).collection('races');
        // await collection.insertOne(pcrs);
        await collection.insertOne(flan);

        console.log("Database seeded! :)");
        client.close();
    }

    catch (err) {
        console.log(err.stack);
    }

}

seedDB();