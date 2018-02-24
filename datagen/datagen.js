

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
    constructor(name, generator, operator){
        this.name = name;
        this.generator = generator;
        if(generator)
            generator.parent = this;
        this.operator = operator;
        this.order = 0;
    }

    // changeGenerator(gen, order){
    //     if (order === 0)
    //         return false;
    //
    //     if (this.order == (order-1)){
    //         this.generator = gen;
    //     }else{
    //         this.generator.changeGenerator(gen, order);
    //     }
    //     return true;
    // }
    changeGenerator(gen){
        if (this.parent) {
            gen.order = this.order;
            gen.parent = this.parent;
            this.parent.generator = gen;
        }

        gen.generator = this.generator;
        // let genSub = this.generator.generator;
        // this.generator = gen;
        // this.generator.generator = genSub;
        //
        // return true;
    }

    addGenerator(gen, order){
        if (!this.generator){
            gen.order = order || 1;
            this.generator = gen;
            gen.parent = this;
        }
        else{
            this.generator.addGenerator(gen, (order || 1) + 1);
        }
    }

    removeLastGenerator(){
        if (!this.generator)
            return;

        if (!this.generator.generator) {
            let removed = this.generator;
            this.generator = undefined;
            return removed;
        }else {
            return this.generator.removeLastGenerator();
        }
    }

    /*Entrada: generators - Lista com as referências dos geradores alocados neste Generator
     *Pega as referências de todos os Generators dentro deste Generator, de forma recursiva, alocando-as em uma lista*/
    getFullGenerator(generators){
        generators.push(this);
        if(this.generator)
            this.generator.getFullGenerator(generators)
    }

    /*Entrada: sub_value - valor que será combinado com o gerado através (ou não) de um operador
     *Saída: lastGenerated - valor gerado pelo Generator
     *Recebe um valor que é inserido no operador juntamente com um segundo valor gerado pelo Generator inserido neste.
     *Caso não exista um operador, o valor inserido é somado ao valor gerado e retornado*/
    generate(sub_value){
        let value = 0;
        if(this.generator){
            value  = this.generator.generate();

            if(this.operator){
                this.lastGenerated = this.operator(sub_value, value);
                return this.lastGenerated;
            }

        }

        this.lastGenerated = sub_value + value;
        return this.lastGenerated;
    }

    getGenParams(){}

    reset(){}

    getModel(){
        let self = this;
        return {
            name: self.name,
            order: self.order
        }
    }
}

class CounterGenerator extends Generator{

    constructor(generator, operator, begin, step){
        super("Counter Generator", generator, operator);
        this.begin = begin || 0;
        this.step = step || 1;
        this.count = this.begin;
        // this.count -= this.step;
    }

    generate(){
        let value = this.count;
        this.count+=this.step;
        return super.generate(value);
    }

    reset(){
        this.count = this.begin;
    }

    getGenParams(){
        return [
            {
                shortName: "Begin",
                variableName: "begin",
                name: "Begin Number",
                type: "number"
            },
            {
                shortName: "Step",
                variableName: "step",
                name: "Step",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.begin = this.begin;
        model.step = this.step;
        return model;
    }
}

class RandomUniformGenerator extends Generator{
    constructor(generator, operator, min, max, disc){
        super("Uniform Generator", generator, operator);
        this.min = min || 0;
        this.max = max || 1;
        this.disc = disc || false;
    }

    generate(){
        let v = randgen.runif(this.min, this.max, this.disc);
        return super.generate(v);
    }

    getGenParams(){
        return [
            {
                shortName: "Min",
                variableName: "min",
                name: "Minimum value",
                type: "number"
            },
            {
                shortName: "Max",
                variableName: "max",
                name: "Maximum value",
                type: "number"
            },
            {
                shortName: "Disc",
                variableName: "disc",
                name: "Discrete Values",
                type: "boolean"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.min = this.min;
        model.max = this.max;
        model.disc = this.disc;
        return model;
    }
}

class RandomGaussianGenerator extends Generator{
    constructor(generator, operator, mean, std){
        super("Gaussian Generator", generator, operator);
        this.mean = mean || 0;
        this.std = std || 1;
    }

    generate(){
        let v = randgen.rnorm(this.mean, this.std);
        return super.generate(v);
    }

    getGenParams(){
        return [
            {
                shortName: "Mean",
                variableName: "mean",
                name: "Mean",
                type: "number"
            },
            {
                shortName: "StD",
                variableName: "std",
                name: "Standard Deviation",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.mean = this.mean;
        model.std = this.std;
        return model;
    }
}

class RandomPoissonGenerator extends Generator{
    constructor(generator, operator, lambda){
        super("Poisson Generator", generator, operator);
        this.lambda = lambda || 1;
    }

    generate(){
        let v = randgen.rpoisson(this.lambda);
        return super.generate(v);
    }

    getGenParams(){
        return [
            {
                shortName: "Lambda",
                variableName: "lambda",
                name: "Lambda",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.lambda = this.lambda;
        return model;
    }
}

class RandomBernoulliGenerator extends Generator{
    constructor(generator, operator, p){
        super("Bernoulli Generator", generator, operator);
        this.p = p || 0.5;
    }

    generate(){
        let v = randgen.rbernoulli(this.p);
        return super.generate(v);
    }

    getGenParams(){
        return [
            {
                shortName: "P",
                variableName: "p",
                name: "Probability",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.p = this.p;
        return model;
    }
}

class RandomCauchyGenerator extends Generator{
    constructor(generator, operator, loc, scale){
        super("Cauchy Generator", generator, operator);
        this.loc = loc || 0;
        this.scale = scale || 1;
    }

    generate(){
        let v = randgen.rcauchy(this.loc, this.scale);
        return super.generate(v);
    }

    getGenParams(){
        return [
            {
                shortName: "X0",
                variableName: "loc",
                name: "Location",
                type: "number"
            },
            {
                shortName: "Scale",
                variableName: "scale",
                name: "Scale",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.loc = this.loc;
        model.scale = this.scale;
        return model;
    }
}

class RandomNoiseGenerator extends Generator{
    constructor(generator, operator, generator2, probability, intensity){
        super("Noise Generator", generator, operator);
        this.generator2 = generator2 || new RandomGaussianGenerator();
        this.probability = probability || 0.3;
        this.intensity = intensity || 1;
    }

    generate(){
        var value = 0;
        if (Math.random() < this.probability){
            return super.generate(this.generator2.generate()) * this.intensity;
        }else{
            return super.generate(0);
        }
    }
    getGenParams(){
        return [
            {
                shortName: "Type",
                variableName: "generator2",
                name: "Generator Type",
                type: "Generator"
            },
            {
                shortName: "Prob",
                variableName: "probability",
                name: "Occurrence Probability",
                type: "number"
            },
            {
                shortName: "Force",
                variableName: "intensity",
                name: "Intensity",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.generator2 = this.generator2.getModel();
        model.probability = this.probability;
        model.intensity = this.intensity;
        return model;
    }
}

class RangeFilter extends Generator {
    constructor(generator, operator, begin, end) {
        super("Range Filter", generator,operator);
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

    getGenParams(){
        return [
            {
                shortName: "Begin",
                variableName: "begin",
                name: "Filter Begin",
                type: "number"
            },
            {
                shortName: "End",
                variableName: "end",
                name: "Filter End",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.begin = this.begin;
        model.end = this.end;
        return model;
    }
}

class LinearScale extends Generator {
    constructor(generator,operator,minDomain,maxDomain, minRange, maxRange) {
        super("Linear Scale",generator,operator);
        this.minDomain = minDomain;
        this.maxDomain = maxDomain;
        this.minRange = minRange;
        this.maxRange = maxRange;
    }

    generate() {
        let result =  (super.generate(0)-this.minDomain)/(this.maxDomain-this.minDomain);
        result = result*(this.maxRange - this.minRange) + this.minRange;
        return result;
    }

    getGenParams() {
        return [
            {
                shortName: "MinIn",
                variableName: "minDomain",
                name: "Minimum Domain Value",
                type: "number"
            },
            {
                shortName: "MaxIn",
                variableName: "maxDomain",
                name: "Maximum Domain Value",
                type: "number"
            },
            {
                shortName: "MinOut",
                variableName: "minRange",
                name: "Minimum Range Value",
                type: "number"
            },
            {
                shortName: "MaxOut",
                variableName: "maxRange",
                name: "Maximum Range Value",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.array = this.array;
        model.minDomain = this.minDomain;
        model.maxDomain = this.maxDomain;
        model.minRange = this.minRange;
        model.maxRange = this.maxRange;
        return model;
    }
}



class MinMax extends Generator {
    constructor(generator, operator, min, max) {
        super("MinMax", generator,operator);
        this.min = min;
        this.max = max;

    }

    generate() {
        let value =  super.generate(0);
        return Math.max(Math.min(value, this.max), this.min);
    }

    getGenParams(){
        return [
            {
                shortName: "Minimum",
                variableName: "min",
                name: "Minimum Value",
                type: "number"
            },
            {
                shortName: "Maximum",
                variableName: "max",
                name: "Maximum Value",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.min = this.min;
        model.max = this.max;
        return model;
    }
}

class RandomCategorical extends Generator {
    constructor(generator,operator,array,number) {
            super("Categorical",generator,operator);
            this.array = array || ["Banana", "Apple", "Orange"];
    }

    generate() {
        let result =  parseInt(super.generate(0));
        if(isNaN(result) || result >= this.array.length || result < 0){
            return this.array[Math.floor(Math.random() * this.array.length)];
        } else{
            return this.array[result];
        }
    }

    getGenParams() {
        return [
            {
                shortName: "List",
                variableName: "array",
                name: "List of Categories",
                type: "array"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.array = this.array;
        return model;
    }
}


class Function extends Generator{

    constructor(name, generator, operator, inputGenerator, inputGenIndex){
        super(name, generator, operator);
        this.inputGenerator = inputGenerator;
        this.inputGenIndex = inputGenIndex;
    }

    generate(){
        let value = this.transform(this.inputGenerator.lastGenerated);
        return super.generate(value);
    }

    transform(x){
        return x;
    }

    getGenParams() {
        return [
            {
                shortName: "Input",
                variableName: "inputGenerator",
                name: "Input Column (Previous one)",
                type: "Column"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.inputGenIndex = this.inputGenIndex;
        return model;
    }
}

class LinearFunction extends Function{
    constructor(generator, operator, inputGenerator, a, b){
        super("Linear Function", generator, operator, inputGenerator);
        this.a = a || 2;
        this.b = b || 0;
    }

    transform(x){
        return this.a*x + this.b;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "a",
                variableName: "a",
                name: "Slope",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
                name: "Intercept",
                type: "number"
            });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.a = this.a;
        model.b = this.b;
        return model;
    }
}

class QuadraticFunction extends Function{
    constructor(generator, operator, inputGenerator, a, b, c){
        super("Quadratic Function", generator, operator, inputGenerator);
        this.a = a || 1;
        this.b = b || 1;
        this.c = c || 0;
    }

    transform(x){
        return this.a*Math.pow(x,2) + this.b*x + this.c;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "a",
                variableName: "a",
                name: "Quadratic Term Constant",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
                name: "Linear Term Constant",
                type: "number"
            },
            {
                shortName: "c",
                variableName: "c",
                name: "Constant Term",
                type: "number"
            });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.a = this.a;
        model.b = this.b;
        model.c = this.c;
        return model;
    }
}

class PolynomialFunction extends Function{
    constructor(generator, operator, inputGenerator, constants){
        super("Polynomial Function", generator, operator, inputGenerator);
        this.constants = constants || [1,1,1];
    }

    transform(x){
        let value = 0;
        for(let i=0; i<this.constants.length; i++){
            value += Math.pow(x,this.constants.length-i-1)*this.constants[i];
        }
        return value;
    }
    getGenParams() {
        let params = super.getGenParams();
        params.push({
            shortName: "Coeffs",
            variableName: "constants",
            name: "Coefficients",
            type: "array"
        });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.constants = this.constants;
        return model;
    }
}

class ExponentialFunction extends Function{
    constructor(generator, operator, inputGenerator,  a, b){
        super("Exponential Function", generator, operator, inputGenerator);
        this.a = a || 2;
        this.b = b || 1;
    }

    transform(x){
        return Math.pow(this.a, x)*this.b;
    }
    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "Base",
                variableName: "a",
                name: "Base",
                type: "number"
            },
            {
                shortName: "Mult",
                variableName: "b",
                name: "Multiplier",
                type: "number"
            });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.a = this.a;
        model.b = this.b;
        return model;
    }
}

class LogarithmFunction extends Function{
    constructor(generator, operator, inputGenerator, base){
        super("Logarithm Function", generator, operator, inputGenerator);
        this.base = base || Math.E;
    }

    transform(x){
        return Math.log(x)/Math.log(this.base);
    }
    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "Base",
                variableName: "base",
                name: "Base",
                type: "number"
            });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.base = this.base;
        return model;
    }

}

class SinusoidalFunction extends Function{
    constructor(generator, operator, inputGenerator, a, b, c){
        super("Sinusoidal Function", generator, operator, inputGenerator);
        this.a = a || 1;
        this.b = b || 1;
        this.c = c || 0;
    }

    transform(x){
        return this.a*Math.sin(this.b*x + this.c);
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "a",
                variableName: "a",
                name: "Amplitude",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
                name: "Frequency",
                type: "number"
            },
            {
                shortName: "c",
                variableName: "c",
                name: "Phase",
                type: "number"
            });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.a = this.a;
        model.b = this.b;
        model.c = this.c;
        return model;
    }
}
///--------------------------  Gerenciador de Colunas e Geração da base total. ----------------------------------------

class DataGen {

    constructor () {
        this.name = "Model";
        this.n_lines = 100; // Quantidade de linhas na geração
        let defaultGenerator = new CounterGenerator();
        let column = {
            name: "Column 1",
            type: "Numeric",
            generator: defaultGenerator
        };
        defaultGenerator.parent = column;
        this.columns = [column];
    }

    addCollumn(name, type, generator){
        generator = generator || new CounterGenerator();
        let column = {
            name: name,
            type: type,
            generator: generator
        };
        generator.parent = column;
        this.columns.push(column);
    }

    changeGeneratorToIndex(index, gen, order){
        if (order === 0)
            this.columns[index].generator = gen;
        else
            this.columns[index].generator.changeGenerator(gen,order);
    }

    addGeneratorToIndex(index, gen){
        this.columns[index].generator.addGenerator(gen);
    }

    removeLastGenerator(index){
        this.columns[index].generator.removeLastGenerator();
    }

    removeCollumn(index){
        if (index > -1)
            this.columns.splice(index, 1);
    }

    generate (){
        console.log("GENERATE!!!!!!");
        let data = [];
        for (let i = 0; i < this.n_lines; i++){
            data.push([]);
            for (let j = 0; j < this.columns.length; j++){
                data[i].push(this.columns[j].generator.generate());
            }
        }
        for (let j = 0; j < this.columns.length; j++){
            console.log(this.columns[j].generator);
            this.columns[j].generator.reset();
        }
        return data;
    }
    
    exportModel(){
        let model = {
            name: this.name,
            generator: []
        };
        for(let i=0; i<this.columns.length; i++){
            model.generator.push({
                name: this.columns[i].name,
                type: this.columns[i].type,
            });
            let fullGenerator = [];
            let fullGenNames = [];
            this.columns[i].generator.getFullGenerator(fullGenerator);
            for(let gen of fullGenerator){
                fullGenNames.push(gen.getModel());
            }
            model.generator[i].generator = fullGenNames;
        }
        console.log(JSON.stringify(model));
        return JSON.stringify(model);
    }

    //TODO: resolver funções e ruido.
    importModel(model_str){
        let model = JSON.parse(model_str);
        for(let i=0; i<model.generator.length; i++){

            let generator;

            for(let j=0; j<model.generator[i].generator.length; j++){
                let selectedGenerator = this.listOfGens[model.generator[i].generator[j].name];
                if(generator){
                    let newgen = new selectedGenerator();
                    generator.addGenerator(newgen);
                    copyAttrs(model.generator[i].generator, newgen);
                }else{
                    generator = new selectedGenerator();
                    copyAttrs(model.generator[i].generator, generator);
                }
            }
            this.name = model.name;
            this.columns.push({
                name: model.generator[i].name,
                type: model.generator[i].type,
                generator: generator
            })
        }
        console.log(this);
    }


}

DataGen.prototype.listOfGens = {
    'Counter Generator': CounterGenerator,
    'Uniform Generator': RandomUniformGenerator,
    'Gaussian Generator': RandomGaussianGenerator,
    'Poisson Generator': RandomPoissonGenerator,
    'Bernoulli Generator': RandomBernoulliGenerator,
    'Cauchy Generator': RandomCauchyGenerator,
    'Noise Generator': RandomNoiseGenerator,
    'Range Filter': RangeFilter,
    'Linear Scale': LinearScale,
    'MinMax': MinMax,
    'Categorical': RandomCategorical,
    'Linear Function': LinearFunction,
    'Quadratic Function': QuadraticFunction,
    'Polynomial Function': PolynomialFunction,
    'Exponential Function': ExponentialFunction,
    'Logarithm Function': LogarithmFunction,
    'Sinusoidal Function': SinusoidalFunction
};

DataGen.prototype.listOfGensForNoise = {
    'Uniform Generator': RandomUniformGenerator,
    'Gaussian Generator': RandomGaussianGenerator,
    'Poisson Generator': RandomPoissonGenerator,
    'Bernoulli Generator': RandomBernoulliGenerator,
    'Cauchy Generator': RandomCauchyGenerator,
};

function copyAttrs(source, target){
    for(let attr in source){
        if(source.hasOwnProperty(attr) && attr !== "name"){
            if(attr === "generator2"){
                target[attr] = new (DataGen.prototype.listOfGens[source[attr]])();
            }else{
                target[attr] = source[attr];
            }
        }
    }
}

//var datagen = new DataGen();
var DataGenerator = DataGen;


if(module){
    module.exports.CounterGenerator =         CounterGenerator;
    module.exports.RandomGaussGenerator =     RandomGaussianGenerator;
    module.exports.RandomPoissonGenerator =   RandomPoissonGenerator;
    module.exports.RandomBernoulliGenerator = RandomBernoulliGenerator;
    module.exports.RandomCauchyGenerator =    RandomCauchyGenerator;
    module.exports.RandomNoiseGenerator =     RandomNoiseGenerator;
}
