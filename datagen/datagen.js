

let randgen = require("randgen");
//
// // console.log(randgen);
// data = [];
//
// for(let i =0; i<50000; i++){
//     data.push(randgen.rnorm());
// }
// let hist = randgen.histogram(data,20);
//
// console.log(hist);

class Generator{
    constructor(generator, operator){
        this.generator = generator;
        this.operator = operator;
    }
    generate(sub_value){
        let value = 0;
        if(this.generator){
            value  = this.generator.generate();

            if(this.operator)
                return this.operator(sub_value, value);
        }

        return sub_value + value;
    }
}

class CounterGenerator extends Generator{

    constructor(generator, operator, count, step){
        super(generator, operator);
        this.count = count || 0;
        this.step = step || 1;
        this.count -= this.step;
    }

    generate(){
        this.count+=this.step;
        return super.generate(this.count);
    }
}

class RandomGaussianGenerator extends Generator{
    constructor(generator, operator, mean, std){
        super(generator, operator);
        this.mean = mean || 0;
        this.std = std || 1;
    }

    generate(){
        let v = randgen.rnorm(this.mean, this.std);
        return super.generate(v);
    }
}

class RandomPoissonGenerator extends Generator{
    constructor(generator, operator, lambda){
        super(generator, operator);
        this.lambda = lambda || 1;
    }

    generate(){
        let v = randgen.rpoisson(this.lambda);
        return super.generate(v);
    }
}

class RandomBernoulliGenerator extends Generator{
    constructor(generator, operator, p){
        super(generator, operator);
        this.p = p || 1;
    }

    generate(){
        let v = randgen.rbernoulli(this.p);
        return super.generate(v);
    }
}

class RandomCauchyGenerator extends Generator{
    constructor(generator, operator, loc, scale){
        super(generator, operator);
        this.loc = loc || 0;
        this.scale = scale || 1;
    }

    generate(){
        let v = randgen.rcauchy(this.loc, this.scale);
        return super.generate(v);
    }
}

class RandomNoiseGenerator extends Generator{
    constructor(generator, operator, generator2, probability, intensity){
        super(generator, operator);
        this.generator2 = generator2 || new RandomGaussianGenerator();
        this.probability = probability || 0.3;
        this.intensity = intensity || 0;
    }

    generate(){
        var value = 0;
        if (Math.random() < this.probability){
            return super.generate(this.generator2.generate()) + this.intensity;
        }else{
            return super.generate(0);
        }
    }
}

class RangeFilter extends Generator {
    constructor(generator,operator, array,begin,end) {
        super(generator,operator);
        this.array = array;
        this.begin = begin;
        this.end = end;

    }

    generate() {
        let value =  super.generate(0);
        while (value > this.begin && value < this.end) {
            value = super.generate(0);
        }
        return value;
    }
}

class RandomCategorical extends  Generator {
    constructor(generator,operator,array,number) {
            super(generator,operator)
            this.array = array.slice(0,number);
    }

    generate() {
        let result =  super.generate(this.array.length);
        if(result === this.array.length){
            return this.array[Math.floor(Math.random() * this.array.length)];
        } else{
            return this.array[result];
        }
        return data;
    }
}



///--------------------------  Gerenciador de Colunas e Geração da base total. ----------------------------------------





class DataGen {

    constructor () {
        this.n_lines = 20; // Quantidade de linhas na geração
        this.columns = [{
            name: "Index",
            type: "Numeric",
            generator: new RandomNoiseGenerator(null, null, null, 0.4, 2)
        }];
    }

    addCollumn(name, type, generator){
        this.columns.push({
            name: name,
            type: type,
            generator: generator
        });
    }

    generate (){
        let data = [];
        for (let i = 0; i < this.n_lines; i++){
            data.push([]);
            for (let j = 0; j < this.columns.length; j++){
                data[i].push(this.columns[j].generator.generate());
            }
        }
        return data;
    }
}

var datagen = new DataGen();
//console.log(datagen.generate());

var generatorToAdd;

function addGenerator(){
    let name = document.getElementById("fname").value;
    let type = document.getElementById("ftype").value;
    let gen = document.getElementById("gen").value;

    if (gen === "Gaussian"){
        generatorToAdd = new RandomGaussianGenerator();
    }else{
        generatorToAdd = new RandomNoiseGenerator();
    }

    datagen.addCollumn(name, type, generatorToAdd);
    showGenerators();
}

function showGenerators(){
    document.getElementById("tbody").innerHTML = "<tr>\n" +
        "                <td></td>\n" +
        "                <td><input value=\"Tipo\" type=\"text\" id=\"fname\"></td>\n" +
        "                <td><input value=\"Numerico\" type=\"text\" id=\"ftype\"></td>\n" +
        "                <td>\n" +
        "                  <select id=\"gen\">\n" +
        "                    <option value=\"Gaussian\">Gaussian</option>\n" +
        "                    <option value=\"Noise\">Noise</option>\n" +
        "                  </select>\n" +
        "                </td>\n" +
        "              </tr>";
    
    for (let i = 0; i < datagen.n_lines; i++){
        document.getElementById("tbody").innerHTML += "<tr>\n" +
            "              <td>" + i + "</td>\n" +
            "              <td>" + datagen.columns[i].name + "</td>\n" +
            "              <td>" + datagen.columns[i].type + "</td>\n" +
            "              <td>connors</td>\n" +
            "            </tr>";
    }
}

module.exports.Generator =                Generator;
module.exports.CounterGenerator =         CounterGenerator;
module.exports.RandomGaussGenerator =     RandomGaussianGenerator;
module.exports.RandomPoissonGenerator =   RandomPoissonGenerator;
module.exports.RandomBernoulliGenerator = RandomBernoulliGenerator;
module.exports.RandomCauchyGenerator =    RandomCauchyGenerator;
module.exports.RandomNoiseGenerator =     RandomNoiseGenerator;