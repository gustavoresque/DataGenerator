const { isNull } = require("lodash");
let DataGen = require("../datagen/datagen.js");


describe("O gerador Uniform Generator", function(){

    it("deve retornar a propriedade name como UniformGerator.", function(){
        let gen = new DataGen.listOfGens["Uniform Generator"](0,50,false);

        let model = gen.getModel();
        expect(model.name).toBe("Uniform Generator");
    });

    it("deve retornar valores entre min e max.", function(){
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

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let gen = new DataGen.listOfGens["Uniform Generator"](0,50,false);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'min', 'max', 'disc'];

        let model = gen.getModel();
        //model.cor = "preto";
        for(prop in model){
            if(model.hasOwnProperty(prop)){
                expect(propsWhiteList.includes(prop)).toBeTrue();
                if(!propsWhiteList.includes(prop)){
                    break
                }
            } else {
                break;
            }         
        }

        let enumAndNonenumKeys = Object.getOwnPropertyNames(model);
        for(let element of propsWhiteList){
            expect(enumAndNonenumKeys.includes(element)).toBeTrue();
            if (!enumAndNonenumKeys.includes(element)) {
              break;
            }
        }
    });

    it("deve conter somente propriedades definidas.", function(){
        let gen = new DataGen.listOfGens["Uniform Generator"](0,50,false);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'min', 'max', 'disc'];

        let model = gen.getModel()
        //model.name = undefined;
        for(p of propsWhiteList){
            expect(model[p]).toBeDefined();
            if(model[p] === undefined){
                break
            }
        }
    });
});


describe("O gerador Categorical", function(){

    it("deve retornar a propriedade name como Categorical.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let gen = new DataGen.listOfGens["Categorical"](array);

        let model = gen.getModel();
        expect(model.name).toBe("Categorical");
    });
    
    it("deve retornar somente os valores passados no array.", function(){
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

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let gen = new DataGen.listOfGens["Categorical"](array);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'array'];

        let model = gen.getModel();
        //model.cor = "preto";
        for(prop in model){
            if(model.hasOwnProperty(prop)){
                expect(propsWhiteList.includes(prop)).toBeTrue();
                if(!propsWhiteList.includes(prop)){
                    break
                }
            } else {
                break;
            }         
        }

        let enumAndNonenumKeys = Object.getOwnPropertyNames(model);
        for(let element of propsWhiteList){
            expect(enumAndNonenumKeys.includes(element)).toBeTrue();
            if (!enumAndNonenumKeys.includes(element)) {
              break;
            }
        }
    });

    it("deve conter somente propriedades definidas.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let gen = new DataGen.listOfGens["Categorical"](array);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'array'];

        let model = gen.getModel()
        //model.name = undefined;
        for(p of propsWhiteList){
            expect(model[p]).toBeDefined();
            if(model[p] === undefined){
                break
            }
        }
    });
});
