let DataGen = require("../datagen/datagen.js");


describe("O gerador", function(){

    it("UniformGerator deve retornar valores entre min e max.", function(){
        let gen = new DataGen.listOfGens["Uniform Generator"](0,50,false);
        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThan(50);
        }
    });
});