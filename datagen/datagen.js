

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
        this.operator = operator;
        this.order = 0;
    }

    changeGenerator(gen){
        if (this.generator == null)
            return false;

        var genSub = this.generator.generator;
        this.generator = gen;
        this.generator.generator = genSub;

        return true;
    }

    addGenerator(gen, order){
        if (this.generator == null){
            gen.order = order;
            this.generator = gen;
        }
        else{
            this.generator.addGenerator(gen, order+1);
        }
    }

    removeLastGenerator(){
        if (this.generator == null)
            return;

        if (this.generator.generator == null)
            this.generator = null;
        else
            this.generator.removeLastGenerator();
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
}

class RangeFilter extends Generator {
    constructor(generator,operator, array,begin,end) {
        super("Range Filter", generator,operator);
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
}


class Function extends Generator{

    constructor(name, generator, operator, inputGenerator){
        super(name, generator, operator);
        this.inputGenerator = inputGenerator;
    }

    generate(){
        let value = this.transform(this.inputGenerator.lastGenerated);
        return super.generate(value);
    }

    transform(x){
        return x;
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
}

class LogarithmFunction extends Function{
    constructor(generator, operator, inputGenerator, base){
        super("Logarithm Function", generator, operator, inputGenerator);
        this.base = base || Math.E;
    }

    transform(x){
        return Math.log(x)/Math.log(this.base);
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
        this.columns[index].generator.addGenerator(gen,1);
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
}

var datagen = new DataGen();
/*let gen = new CounterGenerator(new RandomPoissonGenerator(new RandomGaussianGenerator(new CounterGenerator(new RandomCategorical()))));
datagen.addCollumn("nunu", "Numeric", gen)
console.log(datagen.generate());*/



module.exports.CounterGenerator =         CounterGenerator;
module.exports.RandomGaussGenerator =     RandomGaussianGenerator;
module.exports.RandomPoissonGenerator =   RandomPoissonGenerator;
module.exports.RandomBernoulliGenerator = RandomBernoulliGenerator;
module.exports.RandomCauchyGenerator =    RandomCauchyGenerator;
module.exports.RandomNoiseGenerator =     RandomNoiseGenerator;