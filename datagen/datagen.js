

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

    getFullGenerator(generators){
        generators.push(this);
        if(this.generator)
            this.generator.getFullGenerator(generators)
    }

    generate(sub_value){
        let value = 0;
        if(this.generator){
            value  = this.generator.generate();

            if(this.operator)
                return this.operator(sub_value, value);
        }

        this.lastGenerated = sub_value + value;
        return this.lastGenerated;
    }

    getGenParams(){}

    getModel(){
        let self = this;
        return {
            name: self.name,
            order: self.order
        }
    }
}

class CounterGenerator extends Generator{

    constructor(generator, operator, count, step){
        super("Counter Generator", generator, operator);
        this.count = count || 0;
        this.step = step || 1;
        this.count -= this.step;
    }

    generate(){
        this.count+=this.step;
        return super.generate(this.count);
    }

    getGenParams(){
        return [
            {
                name: "Begin Number",
                type: "number"
            },
            {
                name: "Step",
                type: "number"
            }
        ];
    }

    getModel(){
        let model = super.getModel();
        model.count = this.count;
        model.step = this.step;
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
                name: "Mean",
                type: "number"
            },
            {
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
        this.p = p || 1;
    }

    generate(){
        let v = randgen.rbernoulli(this.p);
        return super.generate(v);
    }

    getGenParams(){
        return [
            {
                name: "P",
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
                name: "Loc",
                type: "number"
            },
            {
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
    getGenParams(){
        return [
            {
                name: "Generator",
                type: "Generator"
            },
            {
                name: "Probability",
                type: "number"
            },
            {
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
                name: "Filter Begin",
                type: "number"
            },
            {
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

class RandomCategorical extends Generator {
    constructor(generator,operator,array,number) {
            super("Categorical",generator,operator);
            if (!array)
                array = [0,1,2,3,4,5];

            if (number)
                this.array = array.slice(0,number);
            else
                this.array = array.slice(0,1);
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

    getGenParams() {
        return [
            {
                name: "Elements",
                type: "array"
            },
            {
                name: "Quantity",
                type: "number"
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
                name: "Input Generator",
                type: "Generator"
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
        this.a = a;
        this.b = b;
    }

    transform(x){
        return this.a*x + this.b;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
            name: "Slope",
            type: "number"
        },
        {
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
        this.a = a;
        this.b = b;
        this.c = c;
    }

    transform(x){
        return this.a*Math.pow(x,2) + this.b*x + this.c;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
                name: "Quadratic Term Constant",
                type: "number"
            },
            {
                name: "Linear Term Constant",
                type: "number"
            },
            {
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
        this.constants = constants;
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
        this.a = a;
        this.b = b || 1;
    }

    transform(x){
        return Math.pow(this.a, x)*this.b;
    }
    getGenParams() {
        let params = super.getGenParams();
        params.push({
                name: "Base",
                type: "number"
            },
            {
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
            name: "Amplitude",
            type: "number"
        },
        {
            name: "Frequency",
            type: "number"
        },
        {
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
        this.n_lines = 0; // Quantidade de linhas na geração
        this.columns = [{
            name: "Title",
            type: "Numeric",
            generator: new CounterGenerator()
        }];

        this.listOfGens = {
            'Counter Generator': CounterGenerator,
            'Gaussian Generator': RandomGaussianGenerator,
            'Poisson Generator': RandomPoissonGenerator,
            'Bernoulli Generator': RandomBernoulliGenerator,
            'Cauchy Generator': RandomCauchyGenerator,
            'Noise Generator': RandomNoiseGenerator,
            'Range Filter': RangeFilter,
            'Categorical': RandomCategorical,
            'Linear Function': LinearFunction,
            'Quadratic Function': QuadraticFunction,
            'Polynomial Function': PolynomialFunction,
            'Exponential Function': ExponentialFunction,
            'Logarithm Function': LogarithmFunction,
            'Sinusoidal Function': SinusoidalFunction
        };
    }

    addCollumn(name, type, generator){
        this.columns.push({
            name: name,
            type: type,
            generator: generator
        });
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
        let data = [];
        for (let i = 0; i < this.n_lines; i++){
            data.push([]);
            for (let j = 0; j < this.columns.length; j++){
                data[i].push(this.columns[j].generator.generate());
            }
        }
        return data;
    }
    
    exportModel(){
        let model = [];
        for(let i=0; i<this.columns.length; i++){
            model.push({
                name: this.columns[i].name,
                type: this.columns[i].type,
            });
            let fullGenerator = [];
            let fullGenNames = [];
            this.columns[i].generator.getFullGenerator(fullGenerator);
            for(let gen of fullGenerator){
                fullGenNames.push(gen.getModel());
            }
            model[i].generator = fullGenNames;
        }
        console.log(JSON.stringify(model));
    }

    //TODO: resolver funções e ruido.
    importModel(model_str){
        let model = JSON.parse(model_str);
        let datagen = new DataGen();
        datagen.columns = [];
        for(let i=0; i<model.length; i++){



            let generator;

            for(let j=0; j<model[i].generator.length; j++){
                let selectedGenerator = this.listOfGens[model[i].generator[j].name];
                if(generator){
                    let newgen = new selectedGenerator();
                    generator.addGenerator(newgen);
                    copyAttrs(model[i].generator, newgen);

                }else{
                    generator = new selectedGenerator();
                    copyAttrs(model[i].generator, generator);
                }

            }

            datagen.columns.push({
                name: model[i].name,
                type: model[i].type,
                generator: generator
            })

        }
        console.log(datagen);
    }


}

function copyAttrs(source, target){
    for(let attr in source){
        if(source.hasOwnProperty(attr) && attr !== "name"){
            target[attr] = source[attr];
        }
    }
}

var datagen = new DataGen();
/*let gen = new CounterGenerator(new RandomPoissonGenerator(new RandomGaussianGenerator(new CounterGenerator(new RandomCategorical()))));
datagen.addCollumn("nunu", "Numeric", gen)
console.log(datagen.generate());*/


if(module){
    module.exports.CounterGenerator =         CounterGenerator;
    module.exports.RandomGaussGenerator =     RandomGaussianGenerator;
    module.exports.RandomPoissonGenerator =   RandomPoissonGenerator;
    module.exports.RandomBernoulliGenerator = RandomBernoulliGenerator;
    module.exports.RandomCauchyGenerator =    RandomCauchyGenerator;
    module.exports.RandomNoiseGenerator =     RandomNoiseGenerator;
}
