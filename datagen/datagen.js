

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
        this.intensity = intensity || 1;
    }

    generate(){
        var value = 0;
        if (Math.random() < this.probability){
            return super.generate(this.generator2.generate());
        }else{
            return super.generate(0);
        }
    }
}

class Intervalos {
    constructor(array, tamanho, intervaloIni, intervaloFim) {
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
        this.n_lines = 1;
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
                data[i].push(this.colums[j].generator.generate());
            }
        }
        return data;
    }

}
let datagen = new DataGen();
datagen.addCollumn("Gaussian", "Numeric", new RandomGaussianGenerator());
console.log(datagen.generate());


module.exports.Generator = Generator;
module.exports.CounterGenerator = CounterGenerator;
module.exports.CounterGenerator = RandomGaussianGenerator;
// module.exports.Generator = Generator;
// module.exports.Generator = Generator;