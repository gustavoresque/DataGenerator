
const http = require('http');
let server = null;
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
                let WSCurrDataGen;
                if(params.hasOwnProperty('modelID')) {
                    if(params.modelID in WSMA) {
                        if(!WSMA[params.modelID][0]) response.end('Model is not avaliable!');
                        WSCurrDataGen = WSMA[params.modelID][1];
                    } else {
                        response.end('Model is not valid!');
                    }
                    let numSam = datagen[WSCurrDataGen].n_lines;
                    if(params.hasOwnProperty('nsample')) {
                        datagen[WSCurrDataGen].n_lines = params.nsample;
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
                    response.end('Model is not defined!')
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