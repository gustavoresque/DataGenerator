const { isNull } = require("lodash");
let DataGen = require("../datagen/datagen.js");


describe("O gerador Uniform Generator", function(){

    it("deve retornar a propriedade name como Uniform Gerator.", function(){
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

describe("O gerador Gaussian Generator", function(){

    it("deve retornar a propriedade name como Gaussian Generator.", function(){
        let gen = new DataGen.listOfGens["Gaussian Generator"](5, 0.1027);

        let model = gen.getModel();
        expect(model.name).toBe("Gaussian Generator");
    });

    it("deve retornar valores media e desvio padrão.", function(){
        let gen = new DataGen.listOfGens["Gaussian Generator"](5, 0.1027);

        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).toBeGreaterThanOrEqual(0);
            if(result < 0){
                break;
            }
        }
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let gen = new DataGen.listOfGens["Gaussian Generator"](5, 0.1027);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'mean', 'std'];

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
        let gen = new DataGen.listOfGens["Gaussian Generator"](5, 0.1027);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'mean', 'std'];

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

describe("O gerador Poisson Generator", function(){

    it("deve retornar a propriedade name como Poisson Generator.", function(){
        let gen = new DataGen.listOfGens["Poisson Generator"](4);

        let model = gen.getModel();
        expect(model.name).toBe("Poisson Generator");
    });

    it("deve retornar valores de Poisson.", function(){
        let gen = new DataGen.listOfGens["Poisson Generator"](4);

        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).toBeGreaterThanOrEqual(0);
            if(result < 0){
                break;
            }
        }
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let gen = new DataGen.listOfGens["Poisson Generator"](2);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'lambda'];

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
        let gen = new DataGen.listOfGens["Poisson Generator"](2);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'lambda'];

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

describe("O gerador Bernoulli Generator", function(){

    it("deve retornar a propriedade name como Bernoulli Generator.", function(){
        let gen = new DataGen.listOfGens["Bernoulli Generator"](4);

        let model = gen.getModel();
        expect(model.name).toBe("Bernoulli Generator");
    });

    it("deve retornar valores de Bernoulli.", function(){
        let gen = new DataGen.listOfGens["Bernoulli Generator"](4);

        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).toBeGreaterThanOrEqual(0);
            if(result < 0){
                break;
            }
        }
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let gen = new DataGen.listOfGens["Bernoulli Generator"](2);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'p'];

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
        let gen = new DataGen.listOfGens["Bernoulli Generator"](2);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'p'];

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

describe("O gerador Cauchy Generator", function(){

    it("deve retornar a propriedade name como Cauchy Generator.", function(){
        let gen = new DataGen.listOfGens["Cauchy Generator"](20, 10);

        let model = gen.getModel();
        expect(model.name).toBe("Cauchy Generator");
    });

    it("deve retornar valores de Cauchy.", function(){
        let gen = new DataGen.listOfGens["Cauchy Generator"](20, 10);

        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).toBeGreaterThanOrEqual(0);
            if(result < 0){
                break;
            }
        }
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let gen = new DataGen.listOfGens["Cauchy Generator"](20, 10);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'loc', 'scale'];

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
        let gen = new DataGen.listOfGens["Cauchy Generator"](20, 10);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'loc', 'scale'];

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

describe("O gerador Categorical Quantity", function(){

    it("deve retornar a propriedade name como Categorical Quantity.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let quantity = [4, 8];
        let gen = new DataGen.listOfGens["Categorical Quantity"](array, quantity);

        let model = gen.getModel();
        expect(model.name).toBe("Categorical Quantity");
    });
    
    it("deve retornar somente os valores passados no array.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let quantity = [4, 8];
        let gen = new DataGen.listOfGens["Categorical Quantity"](array, quantity);

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
        let quantity = [4, 8];
        let gen = new DataGen.listOfGens["Categorical Quantity"](array, quantity);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'array', 'quantity'];

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
        let quantity = [4, 8];
        let gen = new DataGen.listOfGens["Categorical Quantity"](array, quantity);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'array', 'quantity'];

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

describe("O gerador Weighted Categorical", function(){

    it("deve retornar a propriedade name como Weighted Categorical.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let weights = [0.5, 0.3, 0.2];
        let gen = new DataGen.listOfGens["Weighted Categorical"](array, weights);

        let model = gen.getModel();
        expect(model.name).toBe("Weighted Categorical");
    });
    
    it("deve retornar somente os valores passados no array.", function(){
        let array = ["Banana", "Apple", "Orange"];
        let weights = [0.5, 0.3, 0.2];
        let gen = new DataGen.listOfGens["Weighted Categorical"](array, weights);

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
        let weights = [0.5, 0.3, 0.2];
        let gen = new DataGen.listOfGens["Weighted Categorical"](array, weights);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'array', 'weights'];

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
        let weights = [0.5, 0.3, 0.2];
        let gen = new DataGen.listOfGens["Weighted Categorical"](array, weights);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'array', 'weights'];

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

describe("O gerador Poisson Time Generator", function(){

    it("deve retornar a propriedade name como Poisson Time Generator.", function(){
        let initTime = "00:00:00";
        let timeMask = "HH:mm:ss";
        let interval = 10;
        let intervalUnit="minutes";
        let lambda = 4;
        let gen = new DataGen.listOfGens["Poisson Time Generator"](initTime, timeMask, interval, intervalUnit, lambda);

        let model = gen.getModel();
        expect(model.name).toBe("Poisson Time Generator");
    });
    
    it("deve retornar valores de Poisson no padrão HH:mm:ss.", function(){
        let initTime = "00:00:00";
        let timeMask = "HH:mm:ss";
        let interval = 10;
        let intervalUnit="minutes";
        let lambda = 4;
        let gen = new DataGen.listOfGens["Poisson Time Generator"](initTime, timeMask, interval, intervalUnit, lambda);
        let pattern = /^\d{2}:\d{2}:\d{2}$/;

        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            //result = "02:10";
            expect(pattern.test(result)).toBeTrue();
            if(!pattern.test(result)){
                break;
            }
        }
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let initTime = "00:00:00";
        let timeMask = "HH:mm:ss";
        let interval = 10;
        let intervalUnit="minutes";
        let lambda = 4;
        let gen = new DataGen.listOfGens["Poisson Time Generator"](initTime, timeMask, interval, intervalUnit, lambda);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'initTime', 'timeMask', 'interval', 'intervalUnit', 'lambda'];

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
        let initTime = "00:00:00";
        let timeMask = "HH:mm:ss";
        let interval = 10;
        let intervalUnit="minutes";
        let lambda = 4;
        let gen = new DataGen.listOfGens["Poisson Time Generator"](initTime, timeMask, interval, intervalUnit, lambda);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'initTime', 'timeMask', 'interval', 'intervalUnit', 'lambda'];

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
