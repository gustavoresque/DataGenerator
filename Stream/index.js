
const Datagen = require("../datagen/datagen.js");
let datagenBackup = new Datagen();
datagenBackup.columns = [];

datagenBackup.importModel(process.argv.slice(2)[0]);
const numberProcess = process.argv.slice(2)[1];
const file = process.argv.slice(2)[2];
const freeSpace = process.argv.slice(2)[3];

const fs = require('fs');
let onePercent = 1000;

const varSeparator =  datagenBackup.save_as == "csv" ? ',' : '\t';
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
    if(i == 10001) {
        const neededSpace = fs.statSync(file).size/10000*datagenBackup.n_lines
        if(neededSpace>freeSpace) {
            process.send("size:"+neededSpace);
            process.exit(99);//size :)
        }
    }
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