let DataGen = require("../datagen/datagen.js");


describe("O gerador", function(){

    it("UniformGerator deve retornar valores entre min e max.", function(){
        let gen = new DataGen.listOfGens["Uniform Generator"](0,50,false);
        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(50);
            if(result < 0 || result >= 50){
                break;
            }
        }
    });
});

describe("O gerador", function(){

    it("Categorical deve retornar somente os valores passados no array.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let gen = new DataGen.listOfGens["Categorical"](array);
        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(array.includes(result)).toBeTruthy();
            if(!array.includes(result)){
                break;
            }
        }
    });
});

describe("O gerador", function(){

    it("Categorical deve retornar somente os valores passados no array.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let gen = new DataGen.listOfGens["Categorical"](array);
        
        console.log(gen.getModel());
        /*let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(array.includes(result)).toBeTruthy();
            if(!array.includes(result)){
                break;
            }
        }*/
    });
});