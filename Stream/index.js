
const Datagen = require("../datagen/datagen.js");
let datagenBackup = new Datagen();
datagenBackup.columns = [];
datagenBackup.importModel(process.argv.slice(2)[0]);
datagenBackup.n_lines = Number(process.argv.slice(2)[1]);
datagenBackup.header = process.argv.slice(2)[3] == "true" ? true : false;
datagenBackup.save_as = process.argv.slice(2)[4];
const numberProcess = process.argv.slice(2)[5];

const file = process.argv.slice(2)[2];
const fs = require('fs');
let onePercent = 10000;

const varSeparator =  datagenBackup.save_as == "csv" ? ',' : '\t';
let writeStream  = fs.createWriteStream(file);
writeStream.write('[');

const csvWriter = require('csv-write-stream');
let writer = csvWriter({separator: varSeparator,sendHeaders: datagenBackup.header});
writer.pipe(fs.createWriteStream(file));

let i = 0;

function hardWork() {

    if(i%onePercent==0) {
        process.send("Progress"+(numberProcess == "" ? ": " : " ["+numberProcess+"]: ")+String(i*100/datagenBackup.n_lines)+"%");
    }

    let data = datagenBackup.save_as == "json" ? datagenBackup.header ? {} : [] : {};

    for (let j = 0; j < datagenBackup.columns.length; j++){
        if(datagenBackup.columns[j].display) {
            if(datagenBackup.header || datagenBackup.save_as == "csv" || datagenBackup.save_as == "tsv"){
                data[datagenBackup.columns[j].name] = datagenBackup.columns[j].generator.generate();
            } else {
                data.push(datagenBackup.columns[j].generator.generate());

            }
        }
    }
    switch(datagenBackup.save_as) { //In-for
        case "json":
            writeStream.write(JSON.stringify(data)+(i == datagenBackup.n_lines -1 ? '' : ','),"utf8",() => {
                i++;
                if(i<datagenBackup.n_lines) {
                    return hardWork();
                } else {
                    writeStream.end(']');
                    return ;
                }
            });
            break;
        case "csv":
        case "tsv":
            writer.write(data,"utf8",() => {
                i++;
                if(i<datagenBackup.n_lines) {
                    return hardWork();
                } else {
                    return ;
                }
            });
            break;
    }
}

hardWork();