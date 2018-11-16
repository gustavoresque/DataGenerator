
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
let onePercent = 1000;

const varSeparator =  datagenBackup.save_as == "csv" ? ',' : '\t';
// let writeStream  = fs.createWriteStream(file);
// writeStream.write('[');
//
// const csvWriter = require('csv-write-stream');
// let writer = csvWriter({separator: varSeparator,sendHeaders: datagenBackup.header});
// writer.pipe(fs.createWriteStream(file));

const json2csv = require('json2csv').parse;

fs.writeFileSync(file,""); //Clear the file;

switch(datagenBackup.save_as) {
    case "json":
        fs.writeFileSync(file,"[");
        break;
    case "csv":
    case "tsv":
        if(datagenBackup.header) {fs.writeFileSync(file,json2csv("", {fields: datagenBackup.getColumnsNames(),delimiter: varSeparator})+"\n",)};
        break;
}

for(let i = 0;i<datagenBackup.n_lines;i++) {
    // if(i == 10001) {
    //     // if(fs.statSync(file).size/10000*datagenBackup.n_lines>freeSpace) {
    //     if(true) {
    //         process.send(fs.statSync(file).size/10000*datagenBackup.n_lines)
    //         process.exit(3924);//size :)
    //     }
    // }
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
    switch(datagenBackup.save_as) {
        case "json":
            fs.appendFileSync(file,JSON.stringify(data)+(i == datagenBackup.n_lines -1 ? '' : ','))
            break;
        case "csv":
        case "tsv":
            fs.appendFileSync(file,json2csv(data, {delimiter: varSeparator, header: false})+(i == datagenBackup.n_lines -1 ? '' : '\n'));
            break;
    }

}
if(datagenBackup.save_as == "json") {
    fs.appendFileSync(file,"]");
}

// function hardWork() {
//
//     if(i%onePercent==0) {
//         process.send("Progress"+(numberProcess == "" ? ": " : " ["+numberProcess+"]: ")+String(i*100/datagenBackup.n_lines)+"%");
//     }
//
//     let data = datagenBackup.save_as == "json" ? datagenBackup.header ? {} : [] : {};
//
//     for (let j = 0; j < datagenBackup.columns.length; j++){
//         if(datagenBackup.columns[j].display) {
//             if(datagenBackup.header || datagenBackup.save_as == "csv" || datagenBackup.save_as == "tsv"){
//                 data[datagenBackup.columns[j].name] = datagenBackup.columns[j].generator.generate();
//             } else {
//                 data.push(datagenBackup.columns[j].generator.generate());
//
//             }
//         }
//     }
//     switch(datagenBackup.save_as) { //In-for
//         case "json":
//             writeStream.write(JSON.stringify(data)+(i == datagenBackup.n_lines -1 ? '' : ','),"utf8",() => {
//                 i++;
//                 if(i<datagenBackup.n_lines) {
//                     return hardWork();
//                 } else {
//                     writeStream.end(']');
//                     return ;
//                 }
//             });
//             break;
//         case "csv":
//         case "tsv":
//             writer.write(data,"utf8",() => {
//                 i++;
//                 if(i<datagenBackup.n_lines) {
//                     return hardWork();
//                 } else {
//                     return ;
//                 }
//             });
//             break;
//     }
// }
//
// hardWork();