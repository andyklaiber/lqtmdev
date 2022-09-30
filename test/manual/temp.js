const fs = require('fs')
const path = require('path')
const _=require('lodash');
const dayjs = require('dayjs');
var customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const { stringify } = require('csv/sync');

let csv= require('fast-csv');

var stream = fs.createReadStream("rodeocross_2022_race_results_1.CSV");
const racers = require('./rcx_2022_1_racers.json');
const cols = ['event', 'start','category','maxlaps', 'sponsor', 'bibNumber', 'first_name', 'last_name', 'relay','penalties', 'dnf','place','time','laps','avg', 'laptimes']

const replaceCols = ['category', 'sponsor', 'first_name', 'last_name']

let updated = [];
let header;

dayjs('00:40:43.64','HH:mm:ss.SS')
dayjs('00:40:43.64','HH:mm:ss.SS')
dayjs('00:40:43.64','HH:mm:ss.SS')

let count = 0
csv
 .parseStream(stream)
 .on("data", function(data){
    if(count == 0){
        header = data;
        count = count+1;
    }
    let newRow = [] 
    // console.log(data[5])
    let correctRacer = _.find(racers, {bibNumber:data[5]});
    if(correctRacer){

        //console.log(`${data[7]} => ${correctRacer.last_name}`)
        data.forEach((column,idx )=> {
            if(_.includes(replaceCols, cols[idx])){
                let propname = cols[idx];
                let newValue = correctRacer[propname]
                newRow.push(newValue)
            }else{
                newRow.push(column);
            }

        });
        
        updated.push(newRow)
    }

    })
 .on("end", function(){
     console.log("done");
     console.log(updated[0]);
     console.log(updated[1][2]);
     console.log(dayjs(updated[1][12],'HH:mm:ss.SS'));
     updated.sort(
         (row1,row2)=>{
             return row1[2] > row2[2];
            });
        updated.sort(
               (row1,row2)=>{
                   return dayjs(row1[12],'HH:mm:ss.SS') > dayjs(row2[12],'HH:mm:ss.SS')
               });
               updated.splice(0, 0, header);
     let csvData = stringify(updated);
     //3 category
     //

     fs.writeFileSync('csv-remap.csv', csvData);
 });
