

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
    constructor(generator){
        this.generator = generator;
    }
    generate(){
        let value = 0;
        if(this.generator){
            value  = this.generator.generate();
        }
        return value;
    }
}

class CounterGenerator extends Generator{

    constructor(generator, count, step){
        super(generator);
        this.count = count || 0;
        this.step = step || 1;
        this.count -= this.step;
    }

    generate(){
        let value = super.generate();
        this.count+=this.step;
        return this.count+value;
    }
}



///--------------------------  Gerenciador de Colunas e Geração da base total. ----------------------------------------

class DataGen {

    constructor () {
        this.n_lines = 1;
        this.columns = [{
            name: "Index",
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

    generate (){
    }

}
let datagen = new DataGen();
console.log(datagen.columns[0].generator.generate());
console.log(datagen.columns[0].generator.generate());
console.log(datagen.columns[0].generator.generate());
console.log(datagen.columns[0].generator.generate());
console.log(datagen.columns[0].generator.generate());
console.log(datagen.columns[0].generator.generate());




module.exports.Generator = Generator;
module.exports.CounterGenerator = CounterGenerator;
// module.exports.Generator = Generator;
// module.exports.Generator = Generator;