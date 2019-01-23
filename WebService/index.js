
const http = require('http');
let server = null;
const formats = ['json','tsv','csv']
let createServer = () => {
    server = http.createServer((request, response) => {

        // Set CORS headers
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Request-Method', '*');
        response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        response.setHeader('Access-Control-Allow-Headers', '*');

        const userParams = getUrlVars(decodeURIComponent(request.url));
        const url = request.url.indexOf('?') != 1 ? '/?'+request.url.substring(1) : request.url;
        switch(request.method) {
            case "GET":
                let params = getUrlVars(url);
                console.log(params);
                let WSCurrDataGen;
                if(params.hasOwnProperty('modelid')) {
                    if(WSMA.hasOwnProperty(params.modelid)) {
                        if(!WSMA[params.modelid][0]) response.end('Model is not avaliable!');
                        WSCurrDataGen = WSMA[params.modelid][1];
                    } else {
                        response.end('Model is not valid!');
                    }
                    let numSam = datagen[WSCurrDataGen].n_lines;
                    if(params.hasOwnProperty('nsample')) {
                        if(!isNaN(Number(params.nsample)) && isFinite(Number(params.nsample))) datagen[WSCurrDataGen].n_lines = params.nsample;
                    }
                    if(params.hasOwnProperty('format')) {
                        if(formats.includes(params.format)) datagen[WSCurrDataGen].save_as = params.format;
                    }
                    switch(datagen[WSCurrDataGen].save_as) {
                        case "json":
                            response.write("{");
                            response.write(JSON.stringify(datagen[WSCurrDataGen].generate()));
                            response.end("}\n");
                            break;
                        case "csv":
                        case "tsv":
                            const Json2csvParser = require('json2csv').Parser;
                            const fields = datagen[WSCurrDataGen].getColumnsNames();
                            const delimiter = datagen[WSCurrDataGen].save_as == "tsv" ? "\t": ",";
                            const parser = new Json2csvParser({fields: fields, delimiter: delimiter});
                            const parse = parser.parse(datagen[WSCurrDataGen].generate());
                            response.end(parse);
                            break;
                        default:
                            response.end("Error in this data format. Please, change it!");
                    }
                    datagen[WSCurrDataGen].resetAll();
                    datagen[WSCurrDataGen].n_lines = numSam;
                }
                else{
                    // response.end('Model is not defined!')
                    response.end(JSON.stringify(WSMA));
                }
                break;

            default:
                response.end("HTTP/1.1 400 Bad Request\r\n\r\n");
                break;
        }
    });
}

function getUrlVars(url) {
    let myJson = {};
    let hashes = url.slice(url.indexOf('?') + 1).split('&');
    for (let i = 0; i < hashes.length; i++) {
        let hash = hashes[i].split('=');
        myJson[hash[0]] = hash[1];
    }
    return myJson;
}

let closeServer = () => {
    server.close();
}

let changePort = (port) => {
    server.listen(port);
}

module.exports = {
    'createServer': createServer,
    'closeServer': closeServer,
    'changePort': changePort
};