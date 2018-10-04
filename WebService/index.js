let DataGen = require("../datagen/datagen.js");


const http = require('http');

let createServer = () => {
    let server = http.createServer((request, response) => {

        // Set CORS headers
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Request-Method', '*');
        response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
        response.setHeader('Access-Control-Allow-Headers', '*');

        const userParams = getUrlVars(decodeURIComponent(request.url));

        const url = request.url;
        switch(request.method) {
            case "GET":
                let params = getUrlVars(url)
                if(params.hasOwnProperty('modelID')) {
                    let numSam = datagen[currentDataGen].n_lines;;
                    if(params.hasOwnProperty('nSample')) {
                        datagen[currentDataGen].n_lines = params.nSample;
                    }
                    switch(datagen[currentDataGen].save_as) {
                        case "json":
                            break;
                        case "csv":
                            break;
                        case "tsv":
                            break;
                    }
                    response.write("{");
                    response.write(JSON.stringify(datagen[currentDataGen].generate()));
                    response.write("}\n");
                    const Json2csvParser = require('json2csv').Parser;

                    const parser = new Json2csvParser({fileds: datagen[currentDataGen].getColumnsNames()});
                    const csv = parser.parse(datagen[currentDataGen].generate())
                    response.write(csv);

                    datagen[currentDataGen].resetAll();
                    datagen[currentDataGen].n_lines = numSam;
                    //response.end(JSON.stringify(newGen));
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
    server.on('clientError', (err, socket) => {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    });
    server.listen(8000);
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

module.exports = createServer;

//TODO: fazer uma função recursiva para criar objetos ou arrays. [Concluído]
//TODO: Verificar exemplo de modelos e possíveis parâmetros para pôr no GET.
//TODO: Verificar modelo exportado para fazer o tipo POST.