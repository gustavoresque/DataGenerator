let DataGen = require("../datagen/datagen.js");


const http = require('http');

const server = http.createServer((request, response) => {

    // Set CORS headers
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');

    const userParams = getUrlVars(decodeURIComponent(request.url));

    const modelProperty = ['name','generator','n_lines','save_as','header','header_type','ID']; //columns: c_nomeDaDimensão=conteúdoDaDimensão
    const url = request.url;
    switch(request.method) {

        case "GET":
            let params = getUrlVars(url)
            if(params.hasOwnProperty('generator')) {
                let model =
                response.write(params.generator);
                response.end(JSON.stringify(newGen));
            }
            else{
                response.end('Generator is not defined!')
            }

            break;

        case "POST":
            let oie;
            request.on("data", (data) => {
                response.end(data.toString("utf8"));
            });
            break;



        default:
            response.end("HTTP/1.1 400 Bad Request\r\n\r\n");
            break;
    }
    //console.log(url.slice(1,url.indexOf('?')));
    //console.log(request)
    //console.log(x);
    //response.end(JSON.stringify(x));
});
server.on('clientError', (err, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(8000);

function getUrlVars(url) {
    let myJson = {};
    let hashes = url.slice(url.indexOf('?') + 1).split('&');
    for (let i = 0; i < hashes.length; i++) {
        let hash = hashes[i].split('=');
        myJson[hash[0]] = hash[1];
    }
    return myJson;
}

function switchRegEx(name,arrayMatch) {
    for(let i; i< arrayMatch.length;i++) {
        if(arrayMatch[0].test(name)) {
            return arrayMatch[1];
        }
    }
    return 'Uniform Generator';
}

function createUserGenerator(Userparams,propertys) {
    let name = switchRegEx(params.generator,[
        [/constant_value/i,'Constant Value'],
        [/missing_value/i,'Missing Value'],
        [/counter_generator/i,'Counter Generator'],
        [/fixed_time_generator/i,'Fixed Time Generator'],
        [/gaussian_generator/i,'Gaussian Generator'],
        [/poisson_generator/i,'Poisson Generator'],
        [/uniform_generator/i,'Uniform Generator'],
        [/bernoulli_generator/i,'Bernoulli Generator'],
        [/cauchy_generator/i,'Cauchy Generator'],
        [/constant_noise_generator/i,'Constant Noise Generator'],
        [/range_filter/i,'Range Filter'],
        [/linear_scale/i,'Linear Scale'],
        [/no_repeat/i,'No Repeat'],
        [/minmax/i,'MinMax'],
        [/lowpass_filter/i,'Low-Pass Filter'],
        [/weighted_categorical/i,'Weighted Categorical'],
        [/linear_function/i,'Linear Function'],
        [/quadratic_function/i,'Quadratic Function'],
        [/polynomial_function/i,'Polynomial Function'],
        [/exponential_function/i,'Exponential Function'],
        [/logarithm_function/i,'Logarithm Function'],
        [/categorical_function/i,'Categorical Function'],
        [/piecewise_function/i,'Piecewise Function'],
        [/timeLaps_function/i,'TimeLaps Function'],
        [/sinusoidal_sequence'/i,'Sinusoidal Sequence'],
        [/custom_sequence/i,'Custom Sequence']
    ]);
    let newGen = new (DataGen.listOfGens[name])();
    delete params.generator;


    //for(let i; i < )
}

//TODO: fazer uma função recursiva para criar objetos ou arrays. [Concluído]
//TODO: Verificar exemplo de modelos e possíveis parâmetros para pôr no GET.
//TODO: Verificar modelo exportado para fazer o tipo POST.