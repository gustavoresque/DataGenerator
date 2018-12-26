
const Datagen = require("../datagen/datagen.js");
let datagenBackup = new Datagen();
datagenBackup.columns = [];

datagenBackup.importModel(process.argv.slice(2)[0]);
const numberProcess = process.argv.slice(2)[1];
const file = process.argv.slice(2)[2];

let fat = 1.03;
let counter = 10000;
while (counter*10 <= datagenBackup.n_lines) {
    counter *= 10;
    fat += 0.01;
}


const fs = require('fs');
let onePercent = 10000;

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
    if(i%onePercent==0 && i>0) {
        let usedSpace = fs.statSync(file).size;
        // /10000*datagenBackup.n_lines
        process.send("Progress"+(numberProcess == "" ? ": " : " ["+numberProcess+"]: ")+String(i*100/(datagenBackup.n_lines))+"%/"+(sizeFormatter(usedSpace*datagenBackup.n_lines*fat/i,true)));
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

function sizeFormatter(size,unit) {
    if(Number(size)<1024) {
        size = String(size).substr(0,6);
        if(unit) size += " B";
    } else if(Number(size)<1024*1024) {
        size = String(size/(1024)).substr(0,6);
        if(unit) size += " KB";
    } else if(Number(size)<1024*1024*1024) {
        size = String(size/(1024*1024)).substr(0,6);
        if(unit) size += " MB";
    } else if(Number(size)<1024*1024*1024*1024) {
        size = String(size/(1024*1024*1024)).substr(0,6);
        if(unit) size += " GB";
    } else {
        size = size/(1024*1024*1024*1024);
        if(unit) size += " TB";
    }
    return size;
}