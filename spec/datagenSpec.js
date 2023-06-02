const { isNull } = require("lodash");
let DataGen = require("../datagen/datagen.js");


describe("O gerador Uniform Generator", function(){

    it("deve retornar a propriedade name como Uniform Gerator.", function(){
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);

        let model = gen.getModel();
        expect(model.name).toBe("Uniform Generator");
    });

    it("deve retornar valores entre min e max.", function(){
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);

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
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);
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
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);
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
        let loc = 20;
        let scale = 10;
        let gen = new DataGen.listOfGens["Cauchy Generator"](loc, scale);

        let model = gen.getModel();
        expect(model.name).toBe("Cauchy Generator");
    });

    it("deve retornar números.", function(){
        let loc = 20;
        let scale = 10;
        let gen = new DataGen.listOfGens["Cauchy Generator"](loc, scale);

        let result;
        for (let i= 0; i < 1000; i++) {
            result = gen.generate();
            expect(result).not.toEqual(NaN);
            if(Number.isNaN(result)){
                break;
            }
        }
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let loc = 20;
        let scale = 10;
        let gen = new DataGen.listOfGens["Cauchy Generator"](loc, scale);
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
        let loc = 20;
        let scale = 10;
        let gen = new DataGen.listOfGens["Cauchy Generator"](loc, scale);
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

describe("O gerador Random File Name Generator", function(){

    it("deve retornar a propriedade name como Random File Name.", function(){
        let folder = "C:/Users/brynn/Documents/DataGenerator/resources/codigos_gerador_azulejos/input";
        let gen = new DataGen.listOfGens["Random File Name"](folder);

        let model = gen.getModel();
        expect(model.name).toBe("Random File Name");
    });
    
    it("deve retornar valores de Random File Name no padrão HH:mm:ss.", function(){
        let fs = require('fs');
        const path = require('path');
        let folderName = 'C:/Users/brynn/Documents/DataGenerator/resources/codigos_gerador_azulejos/input';
        
        try {
        if (!fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
        } catch (err) {
            console.error(err);
        }

        let folder = [];
        fs.readdirSync(folderName).map(fileName => {
            folder.push(path.join(folderName, fileName).replace(/\\/g,'/'));
        });

        let gen = new DataGen.listOfGens["Random File Name"](folder);
        //let result = gen.generate();
        let model = gen.getModel();
        expect(model.folder).not.toEqual([]);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let folder = "C:/Users/brynn/Documents/DataGenerator/resources/codigos_gerador_azulejos/input";
        let gen = new DataGen.listOfGens["Random File Name"](folder);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'folder'];

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
        let folder = "C:/Users/brynn/Documents/DataGenerator/resources/codigos_gerador_azulejos/input";
        let gen = new DataGen.listOfGens["Random File Name"](folder);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'folder'];

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

describe("O gerador CubicBezier Generator", function(){

    it("deve retornar a propriedade name como CubicBezier Generator.", function(){
        let x0 = 0;
        let y0 = 1;
        let x1 = 2;
        let y1 = 2;
        let x2 = 3;
        let y2 = 4;
        let x3 = 5;
        let y3 = 6;
        let proportional = true;
        let gen = new DataGen.listOfGens["CubicBezier Generator"](x0, y0, x1, y1, x2, y2, x3, y3, proportional);

        let model = gen.getModel();
        expect(model.name).toBe("CubicBezier Generator");
    });
    
    it("deve retornar números.", function(){
        let x0 = 0;
        let y0 = 1;
        let x1 = 2;
        let y1 = 2;
        let x2 = 3;
        let y2 = 4;
        let x3 = 5;
        let y3 = 6;
        let proportional = true;
        let gen = new DataGen.listOfGens["CubicBezier Generator"](x0, y0, x1, y1, x2, y2, x3, y3, proportional);

        let result;
        result = gen.generate();
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let x0 = 0;
        let y0 = 1;
        let x1 = 2;
        let y1 = 2;
        let x2 = 3;
        let y2 = 4;
        let x3 = 5;
        let y3 = 6;
        let proportional = true;
        let gen = new DataGen.listOfGens["CubicBezier Generator"](x0, y0, x1, y1, x2, y2, x3, y3, proportional);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3', 'proportional'];
     
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
        let x0 = 0;
        let y0 = 1;
        let x1 = 2;
        let y1 = 2;
        let x2 = 3;
        let y2 = 4;
        let x3 = 5;
        let y3 = 6;
        let proportional = true;
        let gen = new DataGen.listOfGens["CubicBezier Generator"](x0, y0, x1, y1, x2, y2, x3, y3, proportional);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'x0', 'y0', 'x1', 'y1', 'x2', 'y2', 'x3', 'y3', 'proportional'];

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

describe("O gerador Path2D Stroke Generator", function(){

    it("deve retornar a propriedade name como Path2D Stroke Generator.", function(){
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Stroke Generator"](path);

        let model = gen.getModel();
        expect(model.name).toBe("Path2D Stroke Generator");
    });
    
    it("deve retornar números.", function(){
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Stroke Generator"](path);

        let result;
        result = gen.generate();
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Stroke Generator"](path);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'path'];

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
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Stroke Generator"](path);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'path'];

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

describe("O gerador Path2D Fill Generator", function(){

    it("deve retornar a propriedade name como Path2D Fill Generator.", function(){
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Fill Generator"](path);

        let model = gen.getModel();
        expect(model.name).toBe("Path2D Fill Generator");
    });
    
    it("deve retornar números.", function(){
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Fill Generator"](path);

        let result;
        result = gen.generate();
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Fill Generator"](path);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'path'];

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
        let path = "M10,60 C 20,80 40,80 50,60";
        let gen = new DataGen.listOfGens["Path2D Fill Generator"](path);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'path'];

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

describe("O gerador Linear Function", function(){

    it("deve retornar a propriedade name como Linear Function.", function(){
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let gen = new DataGen.listOfGens["Linear Function"](inputIndex, a, b);

        let model = gen.getModel();
        expect(model.name).toBe("Linear Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let gen = new DataGen.listOfGens["Linear Function"](inputIndex, a, b);

        let result;
        result = gen.generate();
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let gen = new DataGen.listOfGens["Linear Function"](inputIndex, a, b);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b'];

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
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let gen = new DataGen.listOfGens["Linear Function"](inputIndex, a, b);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b'];

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

describe("O gerador Quadratic Function", function(){

    it("deve retornar a propriedade name como Quadratic Function.", function(){
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Quadratic Function"](inputIndex, a, b, c);

        let model = gen.getModel();
        expect(model.name).toBe("Quadratic Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let a = 6;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Quadratic Function"](inputIndex, a, b, c);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Quadratic Function"](inputIndex, a, b, c);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b', 'c'];

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
        let inputIndex = 1;
        let a = 6;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Quadratic Function"](inputIndex, a, b, c);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b', 'c'];

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

describe("O gerador Polynomial Function", function(){

    it("deve retornar a propriedade name como Polynomial Function.", function(){
        let inputIndex = null;
        let constants = [1, 2, 6];
        let gen = new DataGen.listOfGens["Polynomial Function"](inputIndex, constants);

        let model = gen.getModel();
        expect(model.name).toBe("Polynomial Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let constants = [1, 2, 6];
        let gen = new DataGen.listOfGens["Polynomial Function"](inputIndex, constants);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = null;
        let constants = [1, 2, 6];
        let gen = new DataGen.listOfGens["Polynomial Function"](inputIndex, constants);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'constants'];

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
        let inputIndex = null;
        let constants = [1, 2, 6];
        let gen = new DataGen.listOfGens["Polynomial Function"](inputIndex, constants);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'constants'];

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

describe("O gerador Exponential Function", function(){

    it("deve retornar a propriedade name como Exponential Function.", function(){
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let gen = new DataGen.listOfGens["Exponential Function"](inputIndex, a, b);

        let model = gen.getModel();
        expect(model.name).toBe("Exponential Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let gen = new DataGen.listOfGens["Exponential Function"](inputIndex, a, b);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let gen = new DataGen.listOfGens["Exponential Function"](inputIndex, a, b);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b'];

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
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let gen = new DataGen.listOfGens["Exponential Function"](inputIndex, a, b);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b'];

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

describe("O gerador Logarithm Function", function(){

    it("deve retornar a propriedade name como Logarithm Function.", function(){
        let inputIndex = null;
        let base = Math.E;
        let gen = new DataGen.listOfGens["Logarithm Function"](inputIndex, base);

        let model = gen.getModel();
        expect(model.name).toBe("Logarithm Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let base = Math.E;
        let gen = new DataGen.listOfGens["Logarithm Function"](inputIndex, base);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = null;
        let base = Math.E;
        let gen = new DataGen.listOfGens["Logarithm Function"](inputIndex, base);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'base'];

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
        let inputIndex = null;
        let base = Math.E;
        let gen = new DataGen.listOfGens["Logarithm Function"](inputIndex, base);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'base'];

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

describe("O gerador Sinusoidal Function", function(){

    it("deve retornar a propriedade name como Sinusoidal Function.", function(){
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Sinusoidal Function"](inputIndex, a, b, c);

        let model = gen.getModel();
        expect(model.name).toBe("Sinusoidal Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Sinusoidal Function"](inputIndex, a, b, c);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Sinusoidal Function"](inputIndex, a, b, c);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b', 'c'];

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
        let inputIndex = null;
        let a = 1;
        let b = 2;
        let c = 4;
        let gen = new DataGen.listOfGens["Sinusoidal Function"](inputIndex, a, b, c);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'a', 'b', 'c'];

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

describe("O gerador Categorical Function", function(){

    it("deve retornar a propriedade name como Categorical Function.", function(){
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);

        let inputIndex = 1;
        let listOfGenerators = gen;
        
        let genSuper = new DataGen.superTypes["SwitchCaseFunction"](inputIndex, listOfGenerators);
        let params = genSuper.getGenParams();
        params[1].type = "CategoricalColumn";

        let genAux = new DataGen.listOfGens["Categorical Function"](params);

        let model = genAux.getModel();
        expect(model.name).toBe("Categorical Function");
    });
    
    it("deve retornar números.", function(){
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);

        let inputIndex = 1;
        let listOfGenerators = gen;
        
        let genSuper = new DataGen.superTypes["SwitchCaseFunction"](inputIndex, listOfGenerators);
        let params = genSuper.getGenParams();
        params[1].type = "CategoricalColumn";

        let genAux = new DataGen.listOfGens["Categorical Function"](params);

        let result;
        result = genAux.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);

        let inputIndex = 1;
        let listOfGenerators = gen;
        
        let genSuper = new DataGen.superTypes["SwitchCaseFunction"](inputIndex, listOfGenerators);
        let params = genSuper.getGenParams();
        params[1].type = "CategoricalColumn";

        let genAux = new DataGen.listOfGens["Categorical Function"](params);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'listOfGenerators'];

        let model = genAux.getModel();
        
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
        let min = 0;
        let max = 50;
        let disc = false;
        let gen = new DataGen.listOfGens["Uniform Generator"](min, max, disc);

        let inputIndex = 1;
        let listOfGenerators = gen;
        
        let genSuper = new DataGen.superTypes["SwitchCaseFunction"](inputIndex, listOfGenerators);
        let params = genSuper.getGenParams();
        params[1].type = "CategoricalColumn";

        let genAux = new DataGen.listOfGens["Categorical Function"](params);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'listOfGenerators'];

        let model = genAux.getModel();
        //model.name = undefined;
        for(p of propsWhiteList){
            expect(model[p]).toBeDefined();
            if(model[p] === undefined){
                break
            }
        }
    });
});

describe("O gerador Piecewise Function", function(){

    it("deve retornar a propriedade name como Piecewise Function.", function(){
        let inputIndex = null;
        let listOfGenerators = [];
        let intervals = [0];
        let gen = new DataGen.listOfGens["Piecewise Function"](inputIndex, listOfGenerators, intervals);

        let model = gen.getModel();
        expect(model.name).toBe("Piecewise Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let listOfGenerators = [];
        let intervals = [0];
        let gen = new DataGen.listOfGens["Piecewise Function"](inputIndex, listOfGenerators, intervals);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = null;
        let listOfGenerators = [];
        let intervals = [0];
        let gen = new DataGen.listOfGens["Piecewise Function"](inputIndex, listOfGenerators, intervals);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'listOfGenerators', 'intervals'];

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
        let inputIndex = null;
        let listOfGenerators = [];
        let intervals = [0];
        let gen = new DataGen.listOfGens["Piecewise Function"](inputIndex, listOfGenerators, intervals);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'listOfGenerators', 'intervals'];

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

describe("O gerador TimeLaps Function", function(){

    it("deve retornar a propriedade name como TimeLaps Function.", function(){
        let inputIndex = null;
        let listOfGenerators = [];
        let laps = [];
        let gen = new DataGen.listOfGens["TimeLaps Function"](inputIndex, listOfGenerators, laps);

        let model = gen.getModel();
        expect(model.name).toBe("TimeLaps Function");
    });
    
    it("deve retornar números.", function(){
        let inputIndex = null;
        let listOfGenerators = [];
        let laps = [];
        let gen = new DataGen.listOfGens["TimeLaps Function"](inputIndex, listOfGenerators, laps);

        let result;
        result = gen.generate();
        console.log(result);
        expect(result).not.toEqual(NaN);
    });

    it("deve conter um modelo que tenha somente as propriedades listadas no array.", function(){
        let inputIndex = null;
        let listOfGenerators = [];
        let laps = [];
        let gen = new DataGen.listOfGens["TimeLaps Function"](inputIndex, listOfGenerators, laps);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'listOfGenerators', 'laps'];

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
        let inputIndex = null;
        let listOfGenerators = [];
        let laps = [];
        let gen = new DataGen.listOfGens["TimeLaps Function"](inputIndex, listOfGenerators, laps);
        let propsWhiteList = ['name', 'order', 'ID', 'accessOperator', 'inputIndex', 'listOfGenerators', 'laps'];

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