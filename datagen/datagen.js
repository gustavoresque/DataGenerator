

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

class GaussGenerator extends Generator{
    constructor(generator, count, step){
        super(generator);
        this.count = count || 0;
        this.step = step || 1;
        this.count -= this.step;
    }

    generate(){
        let value = super.generate();
        let v = randgen.rnorm();
        return v + value;
    }
}


class Intervalos {
    constructor(array, tamanho, intervaloIni, intervaloFim) {
    }

    generate() {
        if (intervaloIni > intervaloFim || intervaloIni > tamanho) {
            return "error";
        }
        else {
            for (let i = 0; i < 2; i++) {
                x = Math.floor(Math.random() * 1000) + 1;
                while (x > intervaloIni && x < intervaloFim) {
                    x = Math.floor(Math.random() * tamanho) + 1;
                }
                array.push(x);
            }
            return array;
        }
    }
}

class Categorical {
    constructor(string, qtd, items) {
    }

    generate() {
        var frutas = ["banana", "maça", "laranjas", "limão", "uva", "carambola", "marcuja"];


        //var nome =  [];
        var data = [];
        if (string == "frutas") {
            if (items && items < frutas.length) {
                for (let i = 0; i < qtd; i++) {
                    x = frutas[Math.floor(Math.random() * items)];
                    data.push(x);

                }
            }
            for (let i = 0; i < qtd; i++) {
                x = frutas[Math.floor(Math.random() * frutas.length)];
                data.push(x);

            }
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
            generator: new GaussGenerator()
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
console.log(datagen.columns[0].generator.generate());
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