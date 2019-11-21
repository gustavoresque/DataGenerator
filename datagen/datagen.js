
let randgen = require("randgen");
let moment = require("moment");

class Generator{
    constructor(name){
        this.name = name;
        if(this instanceof SwitchCaseFunction)
            this.operator = Generator.Operators.none;
        else
            this.operator = defaultOperator;
        this.order = 0;
        this.ID = "GEN_"+uniqueID();
    }

    addGenerator(gen){
        if (this.generator){
            this.generator.addGenerator(gen);
        } else {
            gen.order = this.order+1;
            this.generator = gen;
            gen.parent = this;
        }
    }

    sumOrder(){
        if (this.parent instanceof Generator){
            this.order = this.parent.order + 1;
        } else if (this.parent instanceof Column){
            this.order = 0;
        }
        if(this instanceof SwitchCaseFunction){
            for(let cat in this.listOfGenerators)
                if(this.listOfGenerators.hasOwnProperty(cat))
                    this.listOfGenerators[cat].sumOrder();
        } else if (this.generator)
            this.generator.sumOrder();
    }

    unlink(){
        if(this.parent){
            if(this.parent instanceof SwitchCaseFunction){
                this.parent.unlinkChild(this);
            }else if(this.generator){
                this.parent.generator = this.generator;
                this.generator.parent = this.parent;
            }else{
                if(this.parent instanceof Column){
                    let newGen = new defaultGenerator();
                    this.parent.generator = newGen;
                    newGen.parent = this.parent;
                }else{
                    this.parent.generator = undefined;
                }
            }
            if(this.parent instanceof Column){
                this.parent.generator.getRootGenerator().sumOrder();
            }else{
                this.parent.getRootGenerator().sumOrder();
            }


        }
    }

    insertGenerator(gen){

        if(this.generator === gen)
            return;

        gen.parent = this;

        if (this.generator){
            this.generator.parent = gen;
            gen.generator = this.generator;
        }else{
            gen.generator = undefined;
        }

        this.generator = gen;
        this.generator.getRootGenerator().sumOrder();
    }

    insertGeneratorBefore(gen){
        if(this.parent instanceof Generator) {
            this.parent.insertGenerator(gen);
            return;
        }else{
            this.parent.generator = gen;

            gen.parent = this.parent;
            gen.generator = this;

            this.parent = gen;
        }
        this.getRootGenerator().sumOrder();
    }

    getRootGenerator(){
        let gen = this;
        if(this.parent instanceof Generator)
            gen = this.parent.getRootGenerator();
        return gen;
    }

    changeGenerator(gen){
        gen.order = this.order;
        if (this.parent) {
            gen.parent = this.parent;
            this.parent.generator = gen;
        }

        gen.generator = this.generator;
        if(gen.generator)
            gen.generator.parent = gen;

        if(gen.parent instanceof SwitchCaseFunction){
            for(let cat in gen.parent.listOfGenerators){
                if(gen.parent.listOfGenerators.hasOwnProperty(cat) && gen.parent.listOfGenerators[cat] === this) {
                    gen.parent.listOfGenerators[cat] = gen;
                }
            }
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

    /*Entrada: generators - Lista com as referências dos geradores alocados neste Generator
     *Pega as referências de todos os Generators dentro deste Generator, de forma recursiva, alocando-as em uma lista*/
    getFullGenerator(generators){
        if(Array.isArray(generators)){
            generators.push(this);
            if(this.generator)
                this.generator.getFullGenerator(generators)
        }else{
            let array = [];
            this.getFullGenerator(array);
            return array;
        }
    }

    /*Entrada: sub_value - valor que será combinado com o gerado através (ou não) de um operador
     *Saída: lastGenerated - valor gerado pelo Generator
     *Recebe um valor que é inserido no operador juntamente com um segundo valor gerado pelo Generator inserido neste.
     *Caso não exista um operador, o valor inserido é somado ao valor gerado e retornado*/
    generate(sub_value){
        if(this.generator && this.operator){
            return this.lastGenerated = this.operator(sub_value, this.generator.generate());
        }
        return this.lastGenerated = sub_value;
    }

    getGenParams(){
        return [
            {
                shortName: "Operator",
                variableName: "accessOperator",
                name: "The operator between this value and right generator value",
                type: "options",
                options: ["sum", "multiply", "modulus", "divide", "subtract", "none", "xor"]
            }
        ];
    }

    set accessOperator (operator){
        this.operator = Generator.Operators[operator];
    }

    get accessOperator (){
        return this.operator.name;
    }

    reset(){
        if(this.generator)
            this.generator.reset();
    }

    /**
     * Retorna o gerador com seus parâmetros para ser serializado pelo JSON.stringify().
     * Ou seja, sem funções e referências a outros objetos.
     * Este método deve ser sobreposto nas subclasses para persistência das variáveis específicas de cada subtipo
     * de gerador.
     *
     * @returns object - Objeto do gerador pronto para serialização via JSON.stringify().
     */
    getModel(){
        return {
            name: this.name,
            order: this.order,
            ID: this.ID,
            accessOperator: this.accessOperator
        }
    }

    getReturnedType(){
        return "Numeric";
    }

    copy(){

    }

    getEstimatedRange(){

    }
}

class Random extends Generator{
    constructor(name){
        super(name);
    }
}

class RandomUniformGenerator extends Random{
    constructor(min, max, disc){
        super("Uniform Generator");
        this.min = min || 0;
        this.max = max || 1;
        this.disc = disc || false;
    }

    generate(){
        let v = randgen.runif(this.min, this.max, this.disc);
        return super.generate(v);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Min",
                variableName: "min",
                name: "Minimum value",
                type: "number"
            },
            {
                shortName: "Max",
                variableName: "max",
                name: "Maximum value",
                type: "number"
            },
            {
                shortName: "Disc",
                variableName: "disc",
                name: "Discrete Values",
                type: "boolean"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.min = this.min;
        model.max = this.max;
        model.disc = this.disc;
        return model;
    }

    copy(){
        let newGen = new RandomUniformGenerator(this.min, this.max, this.disc);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomGaussianGenerator extends Random{
    constructor(mean, std){
        super("Gaussian Generator");
        this.mean = mean || 0;
        this.std = std || 1;
    }

    generate(){
        let v = randgen.rnorm(this.mean, this.std);
        return super.generate(v);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Mean",
                variableName: "mean",
                name: "Mean",
                type: "number"
            },
            {
                shortName: "StD",
                variableName: "std",
                name: "Standard Deviation",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.mean = this.mean;
        model.std = this.std;
        return model;
    }

    copy(){
        let newGen = new RandomGaussianGenerator(this.mean, this.std);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomPoissonGenerator extends Random{
    constructor(lambda){
        super("Poisson Generator");
        this.lambda = lambda || 1;
    }

    generate(){
        let v = randgen.rpoisson(this.lambda);
        return super.generate(v);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Lambda",
                variableName: "lambda",
                name: "Lambda",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.lambda = this.lambda;
        return model;
    }

    copy(){
        let newGen = new RandomPoissonGenerator(this.lambda);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomBernoulliGenerator extends Random{
    constructor(p){
        super("Bernoulli Generator");
        this.p = p || 0.5;
    }

    generate(){
        let v = randgen.rbernoulli(this.p);
        return super.generate(v);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "P",
                variableName: "p",
                name: "Probability",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.p = this.p;
        return model;
    }

    copy(){
        let newGen = new RandomBernoulliGenerator(this.p);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomCauchyGenerator extends Random{
    constructor(loc, scale){
        super("Cauchy Generator");
        this.loc = loc || 0;
        this.scale = scale || 1;
    }

    generate(){
        let v = randgen.rcauchy(this.loc, this.scale);
        return super.generate(v);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "X0",
                variableName: "loc",
                name: "Location",
                type: "number"
            },
            {
                shortName: "Scale",
                variableName: "scale",
                name: "Scale",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.loc = this.loc;
        model.scale = this.scale;
        return model;
    }

    copy(){
        let newGen = new RandomCauchyGenerator(this.loc, this.scale);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomCategorical extends Random {
    constructor(array) {
        super("Categorical");
        this.array = array || ["Banana", "Apple", "Orange"];
    }

    generate() {
        let result =  this.generator ? parseInt(super.generate(0)) : -1;
        if(isNaN(result) || result >= this.array.length || result < 0){
            this.lastGenerated = this.array[Math.floor(Math.random() * this.array.length)];
            return this.lastGenerated;
        } else{
            this.lastGenerated = this.array[result];
            return this.lastGenerated;
        }
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push(
            {
                shortName: "List",
                variableName: "array",
                name: "List of Categories",
                type: "array"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.array = this.array;
        return model;
    }

    getReturnedType(){
        return "Categorical";
    }

    copy(){
        let newGen = new RandomCategorical(this.array);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomCategoricalQtt extends Random {
    constructor(array) {
        super("Categorical Quantity");
        this.array = array || ["Banana", "Apple", "Orange"];
        this.quantity = [3,5];
        this.counterQtt = [];
        for (let a in this.array){
            this.counterQtt.push(0);
        }
    }

    generate() {
        let result =  this.generator ? parseInt(super.generate(0)) : -1;
        if(isNaN(result) || result >= this.array.length || result < 0){
            let pos = 0;
            do{
                pos = Math.floor(Math.random() * this.array.length);
            }while(this.quantity[pos] && ((this.counterQtt[pos] >= this.quantity[pos])));

            this.lastGenerated = this.array[pos];
            this.counterQtt[pos] = this.counterQtt[pos] + 1;
        } else{
            do{
                result = Math.floor(Math.random() * this.array.length);
            }while(this.quantity[result] && (this.counterQtt[result] >= this.quantity[result]));

            this.lastGenerated = this.array[result];
            this.counterQtt[result] = this.counterQtt[result] + 1;
        }

        return this.lastGenerated;
    }

    reset(){
        this.counterQtt = [];
        for (let a in this.array){
            this.counterQtt.push(0);
        }
        super.reset();
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push(
            {
                shortName: "List",
                variableName: "array",
                name: "List of Categories",
                type: "array"
            },
            {
                shortName: "Quantity",
                variableName: "quantity",
                name: "Quantities for each category",
                type: "numarray"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.array = this.array;
        return model;
    }

    getReturnedType(){
        return "Categorical";
    }

    copy(){
        let newGen = new RandomCategorical(this.array);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomWeightedCategorical extends Random {
    constructor(array,weights) {
        super("Weighted Categorical");
        this.array = array || ["Banana", "Apple", "Orange"];
        this.weights = weights || [0.3, 0.2, 0.5];
    }

    generate() {
        let r = Math.random();
        let p = this.weights[0];
        let i = 0;
        while(r > p && i < this.weights.length-1){
            p+=this.weights[i];
            i++;
        }
        this.lastGenerated = this.array[i];
        return this.lastGenerated;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push(
            {
                shortName: "List",
                variableName: "array",
                name: "List of Categories",
                type: "array"
            },
            {
                shortName: "Probs",
                variableName: "weights",
                name: "List of Weights",
                type: "numarray"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.array = this.array;
        model.weights = this.weights;
        return model;
    }

    getReturnedType(){
        return "Categorical";
    }

    copy(){
        let newGen = new RandomWeightedCategorical(this.array, this.weights);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class PoissonTimeGenerator extends Random{
    constructor(initTime, timeMask, interval, intervalUnit,lambda){
        super("Poisson Time Generator");
        this.initTime = initTime || "00:00:00";
        this.interval = interval || 5;
        this.intervalUnit = intervalUnit || "minutes";
        this.timeMask = timeMask || "HH:mm:ss";
        this.lambda = lambda || 2;
        this.time = moment(this.initTime, this.timeMask);
        this.accessIntervalTime = this.interval;
    }

    set accessInitTime(initTime){
        this.initTime = initTime;
        this.time = moment(this.initTime, this.timeMask);
    }
    get accessInitTime(){
        return this.initTime;
    }
    set accessIntervalTime(interval){
        this.interval = interval;
        this.timeInterval = moment.duration(this.interval, this.intervalUnit);
    }
    get accessIntervalTime(){
        return this.interval;
    }

    set accessIntervalUnit(intervalUnit){
        this.intervalUnit = intervalUnit;
        this.timeInterval = moment.duration(this.interval, this.intervalUnit);
    }
    get accessIntervalUnit(){
        return this.intervalUnit;
    }
    set accessMaskTime(timeMask){
        this.timeMask = timeMask;
        this.time = moment(this.initTime, this.timeMask);
        this.accessIntervalTime = this.interval;
    }
    get accessMaskTime(){
        return this.timeMask;
    }

    generate(){
        let events = randgen.rpoisson(this.lambda);
        let millis = events>0
            ? Math.round(this.timeInterval.asMilliseconds()/(events+Math.random()-Math.random()))
            : Math.round(this.timeInterval.asMilliseconds()*(Math.random()+Math.random()));


        this.time.add(millis, "ms");
        this.time.add(super.generate(0), "s");
        this.lastGenerated = this.time.format(this.timeMask);
        return this.lastGenerated;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Init",
                variableName: "accessInitTime",
                name: "Initial Time",
                type: "string"
            },
            {
                shortName: "Inter",
                variableName: "accessIntervalTime",
                name: "Time Duration",
                type: "number"
            },
            {
                shortName: "IntUnit",
                variableName: "accessIntervalUnit",
                name: "Interval Unit",
                type: "options",
                options: ["milliseconds", "seconds", "minutes", "hours", "days", "weeks", "months", "years"]
            },
            {
                shortName: "Mask",
                variableName: "accessMaskTime",
                name: "Time Mask according to Moment.js",
                type: "string"
            },
            {
                shortName: "Lambda",
                variableName: "lambda",
                name: "Expected number of events per interval",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.initTime = this.initTime;
        model.timeMask = this.timeMask;
        model.interval = this.interval;
        model.intervalUnit = this.intervalUnit;
        model.lambda = this.lambda;
        return model;
    }

    copy(){
        // initTime, timeMask, interval, intervalUnit,lambda
        let newGen = new PoissonTimeGenerator(this.initTime, this.timeMask, this.interval, this.intervalUnit, this.lambda);
        //TODO: mover a adição do gerador filho para a superclasse.
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    reset(){
        this.time = moment(this.initTime, this.timeMask);
        this.timeInterval = moment.duration(this.interval, this.intervalUnit);
    }

    getReturnedType(){
        return "Time";
    }
}



class Accessory extends Generator{
    constructor(name){
        super(name);
    }
}

class MCAR extends Accessory{

    constructor(value, probability){
        super("MCAR");
        this.value = value || "Miss";
        this.probability = probability || 0.1;
    }

    generate(){
        if(Math.random() < this.probability) {
            this.lastGenerated = this.value;
            return this.value;
        }else{
            console.log(this)
            return super.generate(false);
        }
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Value",
                variableName: "value",
                name: "The Constant Value",
                type: "auto"
            },
            {
                shortName: "Prob",
                variableName: "probability",
                name: "Occurrence Probability\n Must be between 0 and 1",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.value = this.value;
        model.probability = this.probability;
        return model;
    }

    copy(){
        let newGen = new MCAR(this.value, this.probability);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class MAR extends Accessory{

    constructor(value, probability){
        super("MAR");
        this.value = value || "Miss";
        this.probability = probability || 0.1;
    }

    generate(){
        if(Math.random() < this.probability) {
            this.lastGenerated = this.value;
            return this.value;
        }else{
            return super.generate(0);
        }
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Value",
                variableName: "value",
                name: "The Constant Value",
                type: "auto"
            },
            {
                shortName: "Prob",
                variableName: "probability",
                name: "Occurrence Probability\n Must be between 0 and 1",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.value = this.value;
        model.probability = this.probability;
        return model;
    }

    copy(){
        let newGen = new MAR(this.value, this.probability);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class MNAR extends Accessory{

    constructor(value, probability){
        super("MNAR");
        this.value = value || "Miss";
        this.probability = probability || 0.1;
    }

    generate(){
        if(Math.random() < this.probability) {
            this.lastGenerated = this.value;
            return this.value;
        }else{
            return super.generate(0);
        }
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Value",
                variableName: "value",
                name: "The Constant Value",
                type: "auto"
            },
            {
                shortName: "Prob",
                variableName: "probability",
                name: "Occurrence Probability\n Must be between 0 and 1",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.value = this.value;
        model.probability = this.probability;
        return model;
    }

    copy(){
        let newGen = new MNAR(this.value, this.probability);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomConstantNoiseGenerator extends Accessory{
    constructor(probability, value){
        super("Constant Noise Generator");
        this.probability = probability || 0.3;
        this.value = value || 1;
    }

    generate(){
        if (Math.random() < this.probability){
            this.lastGenerated = super.generate(0) + this.value;
            return this.lastGenerated;
        }else{
            return super.generate(0);
        }
    }
    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Prob",
                variableName: "probability",
                name: "Occurrence Probability",
                type: "number"
            },
            {
                shortName: "Value",
                variableName: "value",
                name: "Constant Value",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.probability = this.probability;
        model.value = this.value;
        return model;
    }

    copy(){
        let newGen = new RandomConstantNoiseGenerator(this.probability, this.value);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomNoiseGenerator extends Accessory{
    constructor(probability, intensity, generator2){
        super("Noise Generator");
        this.generator2 = generator2 || new defaultGenerator();
        this.genType = this.generator2.name;
        this.probability = probability || 0.3;
        this.intensity = intensity || 1;
    }

    generate(){
        if (Math.random() < this.probability){
            this.lastGenerated = super.generate(this.generator2.generate()) * this.intensity;
            return this.lastGenerated;
        }else{
            return super.generate(0);
        }
    }

    get accessGenerator(){
        return this.genType;
    }

    set accessGenerator(genTypeName){
        this.genType = genTypeName;
        this.generator2 = new DataGen.listOfGens[genTypeName]();
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Type",
                variableName: "accessGenerator",
                name: "Noise Type",
                type: "options",
                options: ['Uniform Generator', 'Gaussian Generator', 'Poisson Generator']
            },
            {
                shortName: "Prob",
                variableName: "probability",
                name: "Occurrence Probability",
                type: "number"
            },
            {
                shortName: "Force",
                variableName: "intensity",
                name: "Intensity",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.generator2 = this.generator2.getModel();
        model.probability = this.probability;
        model.intensity = this.intensity;
        return model;
    }

    copy(){
        let newGen = new RandomNoiseGenerator(this.probability, this.intensity);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        if (this.generator2){
            newGen.generator2 = this.generator2.copy();// Talvez dê problema no futuro
        }
        return newGen;
    }
}

class RangeFilter extends Accessory {
    constructor(begin, end) {
        super("Range Filter");
        this.begin = begin;
        this.end = end;

    }

    generate() {
        let value =  super.generate(0);
        while (value > this.begin && value < this.end) {
            value = super.generate(0);
        }
        this.lastGenerated = value;
        return value;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Begin",
                variableName: "begin",
                name: "Filter Begin",
                type: "number"
            },
            {
                shortName: "End",
                variableName: "end",
                name: "Filter End",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.begin = this.begin;
        model.end = this.end;
        return model;
    }

    copy(){
        let newGen = new RangeFilter(this.begin, this.end);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class LinearScale extends Accessory {
    constructor(minDomain,maxDomain, minRange, maxRange) {
        super("Linear Scale");
        this.minDomain = minDomain | 0;
        this.maxDomain = maxDomain | 100;
        this.minRange = minRange | 0;
        this.maxRange = maxRange | 1;
    }

    generate() {
        let result =  (super.generate(0)-this.minDomain)/(this.maxDomain-this.minDomain);
        result = result*(this.maxRange - this.minRange) + this.minRange;
        this.lastGenerated = result;
        return result;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push(
            {
                shortName: "MinIn",
                variableName: "minDomain",
                name: "Minimum Domain Value",
                type: "number"
            },
            {
                shortName: "MaxIn",
                variableName: "maxDomain",
                name: "Maximum Domain Value",
                type: "number"
            },
            {
                shortName: "MinOut",
                variableName: "minRange",
                name: "Minimum Range Value",
                type: "number"
            },
            {
                shortName: "MaxOut",
                variableName: "maxRange",
                name: "Maximum Range Value",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.array = this.array;
        model.minDomain = this.minDomain;
        model.maxDomain = this.maxDomain;
        model.minRange = this.minRange;
        model.maxRange = this.maxRange;
        return model;
    }

    copy(){
        let newGen = new LinearScale(this.minDomain, this.maxDomain, this.minRange, this.maxRange);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class MinMax extends Accessory {
    constructor(min, max) {
        super("MinMax");
        this.min = min || 0;
        this.max = max || 100;
    }

    generate() {
        this.lastGenerated =  Math.max(Math.min(super.generate(0), this.max), this.min);
        return this.lastGenerated;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Minimum",
                variableName: "min",
                name: "Minimum Value",
                type: "number"
            },
            {
                shortName: "Maximum",
                variableName: "max",
                name: "Maximum Value",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.min = this.min;
        model.max = this.max;
        return model;
    }

    copy(){
        let newGen = new MinMax(this.min, this.max);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class LowPassFilter extends Accessory {
    constructor(scale) {
        super("Low-Pass Filter");
        this.scale = scale || 2;
    }

    generate() {
        let lastGenerated = this.lastGenerated;
        let newValue = super.generate(0);
        if(lastGenerated) {
            lastGenerated += (newValue - lastGenerated) / this.scale;
            this.lastGenerated = lastGenerated;
        }else {
            this.lastGenerated = newValue;
        }
        return this.lastGenerated;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Smooth",
                variableName: "scale",
                name: "Smooth Scale",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.scale = this.scale;
        return model;
    }

    copy(){
        let newGen = new LowPassFilter(this.scale);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class NoRepeat extends Accessory {
    constructor() {
        super("No Repeat");
        this.values = [];
    }

    generate() {
        let newValue = super.generate(0);
        while(this.values.includes(newValue))
            newValue = super.generate(0);

        this.values.push(newValue);
        return newValue;
    }

    copy(){
        let newGen = new NoRepeat();
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    reset(){
        super.reset();
        this.values = [];
    }

    getReturnedType(){
        if(this.generator)
            return this.generator.getReturnedType();
        return super.getReturnedType();
    }

}

class GetExtraValue extends Accessory{
    constructor(extra_index, srcGen){
        console.log("criou um novo extra value: ", extra_index, srcGen);
        super("Get Extra Value");
        this.extra_index = extra_index || 1;
        this.srcGen = srcGen;
    }

    generate(){
        let lastValue = 0;
        if(this.srcGen){
            lastValue = this.srcGen["lastGenerated"
            + (this.extra_index > 0 ? this.extra_index : "")];
        }

        if(lastValue)
            return super.generate(lastValue);
        else
            return super.generate(0);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "SrcGen",
                variableName: "accessSrcGen",
                name: "Source Generator",
                type: "Generator"
            },
            {
                shortName: "i",
                variableName: "extra_index",
                name: "Index of Extra Value",
                type: "number"
            }
        );
        return params;
    }

    get accessSrcGen(){
        return this.srcGen;
    }
    set accessSrcGen(ID){
        this.srcGen = ID;
    }

    getModel(){
        let model = super.getModel();
        model.extra_index = this.extra_index;
        model.srcGen = this.srcGen ? this.srcGen.ID : "";
        return model;
    }

    copy(){
        let newGen = new GetExtraValue(this.extra_index, this.srcGen);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}



class Geometric extends Generator{
    constructor(name){
        super(name);
    }
}

class CubicBezierGenerator extends Geometric{
    constructor(x0, y0, x1, y1, x2, y2, x3, y3, proportional){
        super("CubicBezier Generator");
        this.x0 = x0 || 0;
        this.y0 = y0 || 0;
        this.x1 = x1 || 4;
        this.y1 = y1 || 2;
        this.x2 = x2 || 0;
        this.y2 = y2 || 2;
        this.x3 = x3 || 1;
        this.y3 = y3 || 1.8;
        this.proportional = typeof proportional === "boolean" ? proportional : true;


        this.updateProb();

    }

    generate(){

        let t = Math.random();

        if(this.proportional){
            let index =0;
            for(let i=0; i<this.prob.length; i++){
                if(t < this.prob[i]) {
                    index = i;
                    break;
                }
            }
            t = 0.01*Math.random() +  index*0.01;
        }
        let p =this.bezierPoint(t);
        this.lastGenerated1 = p[1];

        return super.generate(p[0]);
    }

    getGenParams(){
        let params = super.getGenParams();
        for(let i=0;i<4;i++){
            params.push(
                {
                    shortName: "x"+i,
                    variableName: "accessx"+i,
                    name: "Control Point X"+i,
                    type: "number"
                },
                {
                    shortName: "y"+i,
                    variableName: "accessy"+i,
                    name: "Control Point Y"+i,
                    type: "number"
                }
            );
        }
        params.push({
            shortName: "prop",
            variableName: "proportional",
            name: "Is Proportional to Length?",
            type: "boolean"
        });
        return params;
    }

    getModel(){
        let model = super.getModel();
        for(let i=0;i<4;i++){
            model["x"+i] = this["x"+i];
            model["y"+i] = this["y"+i];
        }
        model.proportional = this.proportional;
        model.arclength = this.arclength;
        return model;
    }

    copy(){
        let newGen = new CubicBezierGenerator(this.x0, this.y0, this.x1, this.y1, this.x2, this.y2, this.x3, this.y3, this.proportional);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }


    get accessx0() {
        return this.x0;
    }

    set accessx0(x0) {
        this.x0 = x0;
        this.updateProb();
    }

    get accessy0() {
        return this.y0;
    }

    set accessy0(y0) {
        this.y0 = y0;
        this.updateProb();
    }

    get accessx1() {
        return this.x1;
    }

    set accessx1(x1) {
        this.x1 = x1;
        this.updateProb();
    }

    get accessy1() {
        return this.y1;
    }

    set accessy1(y1) {
        this.y1 = y1;
        this.updateProb();
    }

    get accessx2() {
        return this.x2;
    }

    set accessx2(x2) {
        this.x2 = x2;
        this.updateProb();
    }

    get accessy2() {
        return this.y2;
    }

    set accessy2(y2) {
        this.y2 = y2;
        this.updateProb();
    }

    get accessx3() {
        return this.x3;
    }

    set accessx3(x3) {
        this.x3 = x3;
        this.updateProb();
    }

    get accessy3() {
        return this.y3;
    }

    set accessy3(y3) {
        this.y3 = y3;
        this.updateProb();
    }

    updateProb (){
        let x=0, y=0;
        this.prob = [];
        let lastx = this.x0;
        let lasty = this.y0;
        for(let t =0.01; t<1.01; t+=0.01){
            x = Math.pow(1-t,3)*this.x0 + 3*Math.pow(1-t,2)*t*this.x1 + 3*(1-t)*Math.pow(t,2)*this.x2 + Math.pow(t,3)*this.x3;
            y = Math.pow(1-t,3)*this.y0 + 3*Math.pow(1-t,2)*t*this.y1 + 3*(1-t)*Math.pow(t,2)*this.y2 + Math.pow(t,3)*this.y3;
            this.prob.push( Math.sqrt(Math.pow(x-lastx, 2)+Math.pow(y-lasty, 2)) );
            lastx = x;
            lasty = y;
        }
        let sum=0;
        for(let v of this.prob)
            sum+=v;

        this.arclength = sum;

        for(let i=0;i<this.prob.length;i++)
            this.prob[i] = this.prob[i]/sum;

        for(let i=1;i<this.prob.length;i++)
            this.prob[i] = this.prob[i]+this.prob[i-1];
    }

    bezierPoint(t){
        let pts = [];
        let n = 3;
        pts.push([this.x0, this.y0]);
        pts.push([this.x1, this.y1]);
        pts.push([this.x2, this.y2]);
        pts.push([this.x3, this.y3]);

        for (let r=1; r <= n; r++) {
            for (let i=0; i <= n-r; i++) {
                pts[i][0] = (1-t)*pts[i][0] + t*pts[i+1][0];
                pts[i][1] = (1-t)*pts[i][1] + t*pts[i+1][1];
            }
        }
        return pts[0];
    }

    getPolyline(){
        let threshold = 1/20;
        let steps = [0,1];
        let i = 0;
        let breakn = 500, loop=0;
        while(i<steps.length-1){
            if(steps[i+1] - steps[i] < threshold){
                i++;
                continue;
            }

            let test1 = CubicBezierGenerator.collinear_test([
                this.bezierPoint(steps[i]),
                this.bezierPoint((steps[i+1]-steps[i])*0.5+steps[i]),
                this.bezierPoint(steps[i+1])]);
            let test2 = CubicBezierGenerator.collinear_test([
                this.bezierPoint(steps[i]),
                this.bezierPoint((steps[i+1]-steps[i])*0.25+steps[i]),
                this.bezierPoint(steps[i+1])]);
            let test3 = CubicBezierGenerator.collinear_test([
                this.bezierPoint(steps[i]),
                this.bezierPoint((steps[i+1]-steps[i])*0.75+steps[i]),
                this.bezierPoint(steps[i+1])]);



            if(test1 < 0.05 && test2 < 0.05 && test3 < 0.05){
                i++;
            }else{
                steps.splice(i+1, 0, (steps[i+1]-steps[i])*0.5+steps[i]);
            }
            loop++;
            if(loop>breakn)
                break;
        }

        let points_found = [];
        for(let i=0;i<steps.length;i++){
            let p = this.bezierPoint(steps[i]);
            points_found.push(p);
        }
        return points_found;
    }

    static collinear_test(points) {
        if(Math.abs(points[2][0]-points[0][0]) < Math.abs(points[2][1]-points[0][1])){
            let m1 = (points[2][0]-points[0][0])/(points[2][1]-points[0][1]);
            let m2 = (points[1][0]-points[0][0])/(points[1][1]-points[0][1]);
            let m3 = (points[2][0]-points[1][0])/(points[2][1]-points[1][1]);
            return Math.abs(m1-m2) + Math.abs(m1-m3);
        }
        let m1 = (points[2][1]-points[0][1])/(points[2][0]-points[0][0]);
        let m2 = (points[1][1]-points[0][1])/(points[1][0]-points[0][0]);
        let m3 = (points[2][1]-points[1][1])/(points[2][0]-points[1][0]);
        return Math.abs(m1-m2) + Math.abs(m1-m3);
    }
}

class LineGenerator extends Geometric{
    constructor(x0, y0, x1, y1){
        super("LineGenerator Generator");
        this.x0 = typeof x0 === "number" ? x0 : 0;
        this.y0 = typeof y0 === "number" ? y0 : 0;
        this.x1 = typeof x1 === "number" ? x1 : 5;
        this.y1 = typeof y1 === "number" ? y1 : 5;

        this.vertical = this.x1-this.x0 === 0;
        if(!this.vertical){
            this.m = (this.y1-this.y0)/(this.x1-this.x0);
            this.b = this.y0-this.m*this.x0;
            this.arclength = Math.sqrt(Math.pow(this.x0-this.x1,2) + Math.pow(this.y0-this.y1,2));
        }else{
            this.m = Number.POSITIVE_INFINITY;
            this.b = Number.POSITIVE_INFINITY;
            this.arclength = Math.abs(this.y1-this.y0);
        }
    }

    generate(){
        if(this.vertical){
            this.lastGenerated1 = Math.random()*(this.y1-this.y0) + this.y0;
            return super.generate(this.x0);
        }
        let x = Math.random()*(this.x1-this.x0) + this.x0;
        //calc y e guarda no lastGenerated1
        this.lastGenerated1 = this.m*x + this.b;
        return super.generate(x);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "x0",
                variableName: "accessx0",
                name: "Initial X",
                type: "number"
            },
            {
                shortName: "y0",
                variableName: "accessy0",
                name: "Initial Y",
                type: "number"
            },
            {
                shortName: "x1",
                variableName: "accessx1",
                name: "Final X",
                type: "number"
            },
            {
                shortName: "y1",
                variableName: "accessy1",
                name: "Final Y",
                type: "number"
            }
        );
        return params;
    }

    get accessx0(){
        return this.x0;
    }
    set accessx0(x0){
        this.x0 = x0;
        this.vertical = this.x1-this.x0 === 0;
        if(!this.vertical){
            updateLineParams();
        }
    }
    get accessy0(){
        return this.y0;
    }
    set accessy0(y0){
        this.y0 = y0;
        updateLineParams();
    }

    get accessx1(){
        return this.x1;
    }
    set accessx1(x1){
        this.x1 = x1;
        this.vertical = this.x1-this.x0 === 0;
        if(!this.vertical){
            updateLineParams();
        }
    }
    get accessy1(){
        return this.y1;
    }
    set accessy1(y1){
        this.y1 = y1;
        updateLineParams();
    }

    getModel(){
        let model = super.getModel();
        model.x0 = this.x0;
        model.y0 = this.y0;
        model.x1 = this.x1;
        model.y1 = this.y1;
        return model;
    }

    copy(){
        let newGen = new LineGenerator(this.x0, this.y0, this.x1, this.y1);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    updateLineParams(){
        this.m = (this.y1-this.y0)/(this.x1-this.x0);
        this.b = this.y0-this.m*this.x0;
        this.arclength = Math.sqrt(Math.pow(this.x0-this.x1,2) + Math.pow(this.y0-this.y1,2));
    }
}

class Path2DStrokeGenerator extends Geometric{
    constructor(path){
        super("Path2D Stroke Generator");
        this.path = path || "M10,60 C 20,80 40,80 50,60";

        this.updatePath();
    }

    generate(){

        if(this.elements.length > 0){
            let t = Math.random();
            let index =0;
            for(let i=0; i<this.prob.length; i++){
                if(t < this.prob[i]) {
                    index = i;
                    break;
                }
            }

            let x = this.elements[index].generate();
            this.lastGenerated1 = this.elements[index].lastGenerated1;
            return super.generate(x);
        }
        return super.generate(0);

    }

    getGenParams(){
        let params = super.getGenParams();
        params.push({
            shortName: "path",
            variableName: "accessPath",
            name: "Path encoded as 'd' property of a path in SVG.",
            type: "string"
        });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.path = this.path;
        return model;
    }

    copy(){
        let newGen = new Path2DStrokeGenerator(this.path);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    get accessPath(){
        return this.path;
    }
    set accessPath(path){
        this.path = path;
        this.updatePath();
    }

    updatePath(){
        this.elements = [];
        let lastPoint = [0,0];

        let commands = this.path.match(/[ACLMZaclmz][^ACLMZaclmz]*/g);
        let params, quant;

        let initX="none", initY="none";

        console.log(commands);
        for(let c of commands){
            switch (c[0]){
                case "M":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] = +params[i*2];
                        lastPoint[1] = +params[i*2+1];
                    }
                    break;

                case "m":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        console.log(lastPoint[0], +params[i*2]);
                        lastPoint[0] += +params[i*2];
                        lastPoint[1] += +params[i*2+1];
                    }
                    break;

                case "L":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){

                        if(initX === "none"){
                            initX = lastPoint[0];initY=lastPoint[1];
                        }

                        let x = +params[i*2], y = +params[i*2+1];
                        this.elements.push(new LineGenerator(lastPoint[0], lastPoint[1], x, y));
                        lastPoint[0] = x;
                        lastPoint[1] = y;
                    }
                    break;

                case "l":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){

                        if(initX === "none"){
                            initX = lastPoint[0];initY=lastPoint[1];
                        }

                        let x = (+params[i*2])+lastPoint[0], y = (+params[i*2+1])+lastPoint[1];
                        this.elements.push(new LineGenerator(lastPoint[0], lastPoint[1], x, y));
                        lastPoint[0] = x;
                        lastPoint[1] = y;
                    }
                    break;

                case "C":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/6;
                    console.log(params, quant);
                    for(let i=0;i<quant;i++){

                        if(initX === "none"){
                            initX = lastPoint[0];initY=lastPoint[1];
                        }

                        let x1 = +params[i*6], y1 = +params[i*6+1];
                        let x2 = +params[i*6+2], y2 = +params[i*6+3];
                        let x3 = +params[i*6+4], y3 = +params[i*6+5];
                        this.elements.push(new CubicBezierGenerator(lastPoint[0], lastPoint[1],
                            x1,y1,x2,y2,x3,y3, true));
                        lastPoint[0]=x3;
                        lastPoint[1]=y3;
                    }
                    break;
                case "c":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/6;
                    for(let i=0;i<quant;i++){

                        if(initX === "none"){
                            initX = lastPoint[0];initY=lastPoint[1];
                        }

                        let x1 = +params[i*6]; x1 = x1+lastPoint[0];
                        let y1 = +params[i*6+1]; y1 = y1+lastPoint[1];

                        let x2 = +params[i*6+2]; x2 = x2+x1;
                        let y2 = +params[i*6+3]; y2 = y2+y1;

                        let x3 = +params[i*6+4]; x3 = x3+x2;
                        let y3 = +params[i*6+5]; y3 = y3+y2;
                        this.elements.push(new CubicBezierGenerator(lastPoint[0], lastPoint[1],
                            x1,y1,x2,y2,x3,y3, true));
                        lastPoint[0]=x3;
                        lastPoint[1]=y3;
                    }
                    break;

                case "z":
                    console.log("entrou!!!", lastPoint[0], lastPoint[1], initX, initY);
                    this.elements.push(new LineGenerator(lastPoint[0], lastPoint[1], initX, initY));
                    lastPoint[0] = initX;
                    lastPoint[1] = initY;
                    break;
                case "Z":
                    this.elements.push(new LineGenerator(lastPoint[0], lastPoint[1], initX, initY));
                    lastPoint[0] = initX;
                    lastPoint[1] = initY;
                    break;
            }
        }

        let sum = 0;
        this.prob = [];
        console.log(this.elements);
        for(let e of this.elements){
            this.prob.push(e.arclength);
            sum+=e.arclength;
        }

        for(let i=0;i<this.prob.length;i++)
            this.prob[i] = this.prob[i]/sum;

        for(let i=1;i<this.prob.length;i++)
            this.prob[i] = this.prob[i]+this.prob[i-1];
    }
}

class Path2DFillGenerator extends Geometric{
    constructor(path){
        super("Path2D Fill Generator");
        this.path = path || "M10,60 C 20,80 40,80 50,60";

        this.updatePath();
    }

    generate(){

        if(this.prob.length > 0){
            let t = Math.random();
            let height_prob =0;
            for(let i=0; i<this.prob.length; i++){
                if(t < this.prob[i]) {
                    let prob1 = (t-this.prob[i-1])/(this.prob[i]-this.prob[i-1]);
                    height_prob = prob1 * (i/this.prob.length - (i-1)/this.prob.length) + (i-1)/this.prob.length;
                    break;
                }
            }

            let y_scan = (this.boundingBox[3]-this.boundingBox[1])*height_prob+this.boundingBox[1];
            let x_inter = [];
            for(let poly of this.polygons){
                for(let j=0;j<poly.length-1;j++){
                    let ymin = poly[j][1]>poly[j+1][1]?poly[j+1][1]:poly[j][1];
                    let ymax = poly[j][1]<=poly[j+1][1]?poly[j+1][1]:poly[j][1];
                    if((y_scan>ymax || y_scan<=ymin || ymin === ymax))
                        continue;
                    let x_ymin = poly[j][1]>poly[j+1][1]?poly[j+1][0]:poly[j][0];
                    let m = (poly[j+1][1]-poly[j][1])/(poly[j+1][0]-poly[j][0]);

                    x_inter.push((1/m)*(y_scan-ymin) + x_ymin);
                }
            }
            let x_length=0;
            x_inter.sort((a,b) => a-b);
            for(let j=0;j<x_inter.length-1;j+=2){
                x_length+=x_inter[j+1]-x_inter[j];
            }
            let x_pos = Math.random()*x_length + x_inter[0];
            for(let j=1;j<x_inter.length-1;j+=2){
                if(x_pos>x_inter[j]){
                    x_pos+=x_inter[j+1]-x_inter[j];
                }
            }

            this.lastGenerated1 = y_scan;
            return super.generate(x_pos);
        }
        return super.generate(0);

    }

    getGenParams(){
        let params = super.getGenParams();
        params.push({
            shortName: "path",
            variableName: "accessPath",
            name: "Path encoded as 'd' property of a path in SVG.",
            type: "string"
        });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.path = this.path;
        return model;
    }

    copy(){
        let newGen = new Path2DStrokeGenerator(this.path);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    get accessPath(){
        return this.path;
    }
    set accessPath(path){
        this.path = path;
        this.updatePath();
    }

    updatePath(){
        this.elements = [];
        let lastPoint = [0,0];

        let commands = this.path.match(/[ACLMZaclmz][^ACLMZaclmz]*/g);
        let params, quant;
        this.polygons = [[]];
        this.boundingBox = [Number.MAX_VALUE,Number.MAX_VALUE,-Number.MAX_VALUE,-Number.MAX_VALUE];
        let checkBB = (x,y)=>{
            this.boundingBox[0]=this.boundingBox[0]>x?x:this.boundingBox[0];
            this.boundingBox[1]=this.boundingBox[1]>y?y:this.boundingBox[1];
            this.boundingBox[2]=this.boundingBox[2]<x?x:this.boundingBox[2];
            this.boundingBox[3]=this.boundingBox[3]<y?y:this.boundingBox[3];
        };

        let lastp, polyline;
        for(let c of commands){
            switch (c[0]){
                case "M":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] = +params[i*2];
                        lastPoint[1] = +params[i*2+1];
                    }
                    break;

                case "m":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] += +params[i*2];
                        lastPoint[1] += +params[i*2+1];
                    }
                    break;

                case "L":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        let x = +params[i*2], y = +params[i*2+1];


                        lastp = this.polygons[this.polygons.length-1];
                        lastp = lastp[lastp.length-1];
                        if(lastp){
                            console.log(lastPoint[0], lastp[0]);
                            if(lastPoint[0] !== lastp[0] || lastPoint[1] !== lastp[1]) {
                                this.polygons.push([[lastPoint[0], lastPoint[1]]]);
                                checkBB(lastPoint[0], lastPoint[1]);
                            }
                        }
                        lastp = this.polygons[this.polygons.length-1];
                        lastp.push([x,y]);
                        checkBB(x,y);

                        lastPoint[0] = x;
                        lastPoint[1] = y;
                    }
                    break;

                case "l":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        let x = (+params[i*2])+lastPoint[0], y = (+params[i*2+1])+lastPoint[1];


                        lastp = this.polygons[this.polygons.length-1];
                        lastp = lastp[lastp.length-1];
                        if(lastp) {
                            if (lastPoint[0] !== lastp[0] || lastPoint[1] !== lastp[1]) {
                                console.log("novo poly:" , [lastPoint[0], lastPoint[1]]);
                                this.polygons.push([[lastPoint[0], lastPoint[1]]]);
                                checkBB(lastPoint[0], lastPoint[1]);
                            }
                        }
                        lastp = this.polygons[this.polygons.length-1];
                        lastp.push([x,y]);
                        checkBB(x,y);

                        lastPoint[0] = x;
                        lastPoint[1] = y;
                    }
                    break;

                case "C":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/6;

                    for(let i=0;i<quant;i++){
                        let x1 = +params[i*6], y1 = +params[i*6+1];
                        let x2 = +params[i*6+2], y2 = +params[i*6+3];
                        let x3 = +params[i*6+4], y3 = +params[i*6+5];

                        let cbg = new CubicBezierGenerator(lastPoint[0], lastPoint[1],x1,y1,x2,y2,x3,y3, true);
                        polyline = cbg.getPolyline();
                        lastp = this.polygons[this.polygons.length-1];
                        lastp = lastp[lastp.length-1];
                        if(lastp){
                            //Verifica se tem que criar um novo polígono.
                            if(lastPoint[0] !== lastp[0] || lastPoint[1] !== lastp[1]) {
                                this.polygons.push([[lastPoint[0], lastPoint[1]]]);
                                checkBB(lastPoint[0], lastPoint[1]);
                            }
                        }
                        lastp = this.polygons[this.polygons.length-1];
                        if(lastp.length !== 0)
                            polyline.shift();
                        Array.prototype.push.apply(lastp, polyline);
                        for(let p of polyline)
                            checkBB(p[0],p[1]);

                        lastPoint[0]=x3;
                        lastPoint[1]=y3;
                    }
                    break;
                case "c":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/6;
                    for(let i=0;i<quant;i++){
                        let x1 = +params[i*6]; x1 = x1+lastPoint[0];
                        let y1 = +params[i*6+1]; y1 = y1+lastPoint[1];

                        let x2 = +params[i*6+2]; x2 = x2+x1;
                        let y2 = +params[i*6+3]; y2 = y2+y1;

                        let x3 = +params[i*6+4]; x3 = x3+x2;
                        let y3 = +params[i*6+5]; y3 = y3+y2;


                        let cbg = new CubicBezierGenerator(lastPoint[0], lastPoint[1],x1,y1,x2,y2,x3,y3, true);
                        polyline = cbg.getPolyline();
                        lastp = this.polygons[this.polygons.length-1];
                        lastp = lastp[lastp.length-1];
                        if(lastp) {
                            if (lastPoint[0] !== lastp[0] || lastPoint[1] !== lastp[1]) {
                                this.polygons.push([[lastPoint[0], lastPoint[1]]]);
                                checkBB(lastPoint[0], lastPoint[1]);
                            }
                        }
                        lastp = this.polygons[this.polygons.length-1];
                        if(lastp.length !== 0)
                            polyline.shift();
                        Array.prototype.push.apply(lastp, polyline);
                        for(let p of polyline)
                            checkBB(p[0],p[1]);


                        lastPoint[0]=x3;
                        lastPoint[1]=y3;
                    }
                    break;

                case "Z":
                    lastp = this.polygons[this.polygons.length-1];
                    console.log(lastp[0]);
                    lastPoint[0] = lastp[0][0];
                    lastPoint[1] = lastp[0][1];
                    break;
                case "z":
                    lastp = this.polygons[this.polygons.length-1];
                    console.log(lastp[0]);
                    lastPoint[0] = lastp[0][0];
                    lastPoint[1] = lastp[0][1];
                    break;
            }
        }

        //Fecha os polígonos não fechados.
        for(let poly of this.polygons){
            if(poly[0][0] !== poly[poly.length-1][0] || poly[0][1] !== poly[poly.length-1][1]){
                poly.push([poly[0][0], poly[0][1]]);
            }
            console.log(poly);
        }

        let ystep = (this.boundingBox[3] - this.boundingBox[1])/100;
        let stepLength = [];
        for(let i=0;i<=100;i++){
            stepLength.push(0);
            let y_scan = ystep*i+this.boundingBox[1];
            let x_inter = [];
            for(let poly of this.polygons){
                for(let j=0;j<poly.length-1;j++){
                    let ymin = poly[j][1]>poly[j+1][1]?poly[j+1][1]:poly[j][1];
                    let ymax = poly[j][1]<=poly[j+1][1]?poly[j+1][1]:poly[j][1];
                    if((y_scan>ymax || y_scan<=ymin || ymin === ymax))
                        continue;
                    let x_ymin = poly[j][1]>poly[j+1][1]?poly[j+1][0]:poly[j][0];
                    let m = (poly[j+1][1]-poly[j][1])/(poly[j+1][0]-poly[j][0]);

                    x_inter.push((1/m)*(y_scan-ymin) + x_ymin);
                }
            }
            x_inter.sort((a,b) => a-b);
            for(let j=0;j<x_inter.length-1;j+=2){
                stepLength[i]+=x_inter[j+1]-x_inter[j];
            }
        }

        let totalLengths = 0;
        for(let l of stepLength){
            totalLengths+=l;
        }
        this.prob = [];
        for(let l of stepLength)
            this.prob.push(l/totalLengths);

        for(let i=1;i<this.prob.length;i++)
            this.prob[i] = this.prob[i]+this.prob[i-1];

    }
}



class Function extends Generator{

    constructor(name, inputGenerator, inputGenIndex){
        super(name);
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
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Input",
                variableName: "inputGenerator",
                name: "Input Column (Previous one)",
                type: "NumericColumn"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.inputGenIndex = this.inputGenIndex;
        return model;
    }

    copy(){
        let newGen = new this.constructor(this.inputGenerator);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        newGen.inputGenerator = this.inputGenerator;
        newGen.inputGenIndex = this.inputGenIndex;
        return newGen;
    }
}

class LinearFunction extends Function{
    constructor(inputGenerator, a, b){
        super("Linear Function", inputGenerator);
        this.a = a || 2;
        this.b = b || 0;
    }

    transform(x){
        return this.a*x + this.b;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "a",
                variableName: "a",
                name: "Slope",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
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

    copy(){
        let newGen = super.copy();
        newGen.a = this.a;
        newGen.b = this.b;
        return newGen;
    }
}

class QuadraticFunction extends Function{
    constructor(inputGenerator, a, b, c){
        super("Quadratic Function", inputGenerator);
        this.a = a || 1;
        this.b = b || 1;
        this.c = c || 0;
    }

    transform(x){
        return this.a*Math.pow(x,2) + this.b*x + this.c;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "a",
                variableName: "a",
                name: "Quadratic Term Constant",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
                name: "Linear Term Constant",
                type: "number"
            },
            {
                shortName: "c",
                variableName: "c",
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

    copy(){
        let newGen = super.copy();
        newGen.a = this.a;
        newGen.b = this.b;
        newGen.c = this.c;
        return newGen;
    }
}

class PolynomialFunction extends Function{
    constructor(inputGenerator, constants){
        super("Polynomial Function", inputGenerator);
        this.constants = constants || [1,1,1];
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
            shortName: "Coeffs",
            variableName: "constants",
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

    copy(){
        let newGen = super.copy();
        newGen.constants = this.constants;
        return newGen;
    }
}

class ExponentialFunction extends Function{
    constructor(inputGenerator, a, b){
        super("Exponential Function", inputGenerator);
        this.a = a || 2;
        this.b = b || 1;
    }

    transform(x){
        return Math.pow(this.a, x)*this.b;
    }
    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "Base",
                variableName: "a",
                name: "Base",
                type: "number"
            },
            {
                shortName: "Mult",
                variableName: "b",
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

    copy(){
        let newGen = super.copy();
        newGen.a = this.a;
        newGen.b = this.b;
        return newGen;
    }
}

class LogarithmFunction extends Function{
    constructor(inputGenerator, base){
        super("Logarithm Function", inputGenerator);
        this.base = base || Math.E;
    }

    transform(x){
        return Math.log(x)/Math.log(this.base);
    }
    getGenParams() {
        let params = super.getGenParams();
        params.push({
                shortName: "Base",
                variableName: "base",
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

    copy(){
        let newGen = super.copy();
        newGen.base = this.base;
        return newGen;
    }
}

class SinusoidalFunction extends Function{
    constructor(inputGenerator, a, b, c){
        super("Sinusoidal Function", inputGenerator);
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
                shortName: "a",
                variableName: "a",
                name: "Amplitude",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
                name: "Frequency",
                type: "number"
            },
            {
                shortName: "c",
                variableName: "c",
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

    copy(){
        let newGen = super.copy();
        newGen.a = this.a;
        newGen.b = this.b;
        newGen.c = this.c;
        return newGen;
    }
}

class SwitchCaseFunction extends Function{
    constructor(name, listOfGenerators, inputGenerator, inputGenIndex){
        super(name, inputGenerator, inputGenIndex);
        this.listOfGenerators = listOfGenerators || {};
        this.inputArray = [];
    }

    reset(){
        //Sempre que ocorre um reset, o switchCaseFunction avalia a lista de input para verificar se essa lista possui valores novos.
        //Se possui valores a mais, são incluidos RandomUniformGenerators, caso possua um input a menos esse é removido.
        if (!this.inputGenerator || !this.inputArray)
            return;

        let auxgen = new RandomUniformGenerator();
        this.generator = auxgen;
        auxgen.parent = this;

        let attrs = [];
        this.array = [];
        for(let attr in this.listOfGenerators){
            if(this.listOfGenerators.hasOwnProperty(attr)){
                //Todos os geradores são resetados aqui.

                this.listOfGenerators[attr].reset();

                if(this.listOfGenerators[attr].array)
                    this.array.push.apply(this.array, this.listOfGenerators[attr].array);

                attrs.push(attr);
            }
        }
        //retorna valores únicos do array
        this.array = [...new Set(this.array)];
        for(let i=0; i<this.inputArray.length; i++){
            if(!(this.listOfGenerators[this.inputArray[i]])) {
                let gen = new RandomUniformGenerator();
                auxgen.changeGenerator(gen);
                this.listOfGenerators[this.inputArray[i]] = gen;
            }
            let index = attrs.indexOf(this.inputArray[i]);
            if(index >= 0){
                attrs.splice(index, 1);
            }
        }
        for(let attr of attrs){
            this.listOfGenerators[attr] = undefined;
            delete this.listOfGenerators[attr];
        }
    }

    transform(x){
        this.generator = this.listOfGenerators[x];
        return 0;
    }


    getModel(){
        let model = super.getModel();
        model.listOfGenerators = {};
        for(let p in this.listOfGenerators){
            if(this.listOfGenerators.hasOwnProperty(p)){
                let fullGen = [];
                this.listOfGenerators[p].getFullGenerator(fullGen);
                model.listOfGenerators[p] = [];//this.listOfGenerators[p].getModel();
                for(let gen of fullGen){
                    model.listOfGenerators[p].push(gen.getModel());
                }
            }
        }
        return model;
    }

    getReturnedType(){
        let outType;
        for(let genName in this.listOfGenerators){
            if(this.listOfGenerators.hasOwnProperty(genName)) {
                if(outType && outType !== this.listOfGenerators[genName].getReturnedType()){
                    return "Mixed";
                }
                outType = this.listOfGenerators[genName].getReturnedType();
            }
        }
        if(outType){
            return outType;
        }
        return "Numeric";
    }

    copy(){
        let newList = {};
        //Copia a lista de Geradores
        for(let prop in this.listOfGenerators)
            if(this.listOfGenerators.hasOwnProperty(prop))
                newList[prop] = this.listOfGenerators[prop].copy();

        let newGen = new this.constructor(newList, this.inputGenerator, this.inputGenIndex);

        for(let prop in newList)
            if(newList.hasOwnProperty(prop))
                newList[prop].parent = newGen;

        newGen.inputGenerator = this.inputGenerator;
        newGen.inputGenIndex = this.inputGenIndex;

        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    unlinkChild(child){
        for(let cat in this.listOfGenerators) {
            if (this.listOfGenerators.hasOwnProperty(cat)) {
                if (this.listOfGenerators[cat] === child) {
                    this.listOfGenerators[cat] = child.generator || new defaultGenerator();
                    this.listOfGenerators[cat].parent = this;
                }
            }
        }
    }

}

class CategoricalFunction extends SwitchCaseFunction{
    constructor(listOfGenerators, inputGenerator, inputGenIndex){
        super("Categorical Function", listOfGenerators, inputGenerator, inputGenIndex);
    }

    getGenParams() {
        let params = super.getGenParams();
        params[1].type = "CategoricalColumn";
        return params;
    }

    reset(){
        if (!this.inputGenerator)
            return;
        this.inputArray = this.inputGenerator.array;
        super.reset();
    }

}

class PiecewiseFunction extends SwitchCaseFunction{
    constructor(listOfGenerators, inputGenerator, inputGenIndex, intervals){
        super("Piecewise Function", listOfGenerators, inputGenerator, inputGenIndex);
        this.intervals = intervals || [0];
    }

    get accessIntervals(){
        return this.intervals;
    }

    set accessIntervals(intervals){
        this.intervals = intervals;
        this.reset();
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push({
            shortName: "Intervals",
            variableName: "accessIntervals",
            name: "List of Intervals to define the sub-fuctions",
            type: "array"
        });
        return params;
    }

    transform(x){
        for(let interval of this.intervals){
            if(x <= interval){
                this.generator = this.listOfGenerators["<= "+interval];
                return 0;
            }
        }
        if(this.intervals.length > 0)
            this.generator = this.listOfGenerators["> "+this.intervals[this.intervals.length-1]];
        return 0;
    }

    getModel(){
        let model = super.getModel();
        model.intervals = this.intervals;
        return model;
    }

    reset(){
        this.inputArray = [];

        if (!this.inputGenerator)
            return;

        //Caso não tenha nenhum intervalo definido ele cria uma função para qualquer condição.
        if(this.intervals.length === 0){
            this.inputArray = ["any condition"];
            super.reset();
            return;
        }

        for(let interval of this.intervals){
            this.inputArray.push("<= "+interval);
        }
        this.inputArray.push("> "+this.intervals[this.intervals.length-1]);
        super.reset();
    }


    copy(){

        let newGen = super.copy();
        if(this.intervals)
            newGen.intervals = this.intervals;
        return newGen;
    }
}

class TimeLapsFunction extends SwitchCaseFunction{
    constructor(listOfGenerators, inputGenerator, inputGenIndex, laps){
        super("TimeLaps Function", listOfGenerators, inputGenerator, inputGenIndex);
        this.accessLaps = laps || [];
    }

    transform(x){
        let inputTime = moment(x, this.inputGenerator.timeMask);
        for(let timeLap of this.timeLaps){
            if(inputTime.isSameOrBefore(timeLap)){
                this.generator = this.listOfGenerators["<= "+timeLap.format(this.inputGenerator.timeMask)];
                return 0;
            }
        }
        if(this.timeLaps.length > 0)
            this.generator = this.listOfGenerators["> "+this.timeLaps[this.timeLaps.length-1].format(this.inputGenerator.timeMask)];
        return 0;
    }

    get accessLaps(){
        return this.laps;
    }

    set accessLaps(laps){
        this.laps = laps;
        this.reset();
    }


    reset(){
        this.timeLaps = [];
        this.inputArray = [];

        if (!this.inputGenerator)
            return;

        //Caso não tenha nenhum lap ele cria uma função para qualquer tempo.
        if(this.laps.length === 0){
            this.inputArray = ["any time"];
            super.reset();
            return;
        }

        for(let lap of this.laps){
            let timeLap = moment(lap, this.inputGenerator.timeMask);
            this.timeLaps.push(timeLap);
            this.inputArray.push("<= "+timeLap.format(this.inputGenerator.timeMask));
        }
        this.inputArray.push("> "+this.timeLaps[this.timeLaps.length-1].format(this.inputGenerator.timeMask));
        super.reset();
    }

    getGenParams() {
        let params = super.getGenParams();
        params[1].type = "TimeColumn";
        params.push({
            shortName: "Laps",
            variableName: "accessLaps",
            name: "Laps of Time in Ascending Order",
            type: "array"
        });
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.laps = this.laps;
        return model;
    }

    copy(){
        let newGen = super.copy();
        if(this.laps)
            newGen.accessLaps = this.laps;
        return newGen;
    }
}




class Sequence extends Generator{
    constructor(name, begin, step){
        super(name);
        this.begin = begin || 0;
        this.step = step || 1;
        this.count = this.begin;
    }

    reset(){
        this.count = this.begin;
        super.reset();
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Begin",
                variableName: "begin",
                name: "Begin Number",
                type: "number"
            },
            {
                shortName: "Step",
                variableName: "step",
                name: "Step",
                type: "number"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.begin = this.begin;
        model.step = this.step;
        return model;
    }
}

class ConstantValue extends Sequence{

    constructor(value){
        super("Constant Value");
        this.value = value || 1;
    }

    generate(){
        return super.generate(this.value);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Value",
                variableName: "value",
                name: "The Constant Value",
                type: "number",
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.value = this.value;
        return model;
    }

    copy(){
        let newGen = new ConstantValue(this.value);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    getEstimatedRange(){
        return [this.value];
    }
}

class CounterGenerator extends Sequence{

    constructor(begin, step){
        super("Counter Generator", begin, step);
    }

    generate(){
        let value = this.count;
        this.count+=this.step;
        return super.generate(value);
    }

    copy(){
        let newGen = new CounterGenerator(this.begin, this.step);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class SinusoidalSequence extends Sequence{

    constructor(begin, step, a, b, c){
        super("Sinusoidal Sequence", begin || 0, step || Math.PI/16);
        this.a = a || 1;
        this.b = b || 1;
        this.c = c || 0;
    }

    generate(){
        let value = this.a*Math.sin(this.count*this.b + this.c);
        this.count+=this.step;
        return super.generate(value);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push({
                shortName: "a",
                variableName: "a",
                name: "Amplitude",
                type: "number"
            },
            {
                shortName: "b",
                variableName: "b",
                name: "Frequency",
                type: "number"
            },
            {
                shortName: "c",
                variableName: "c",
                name: "Phase",
                type: "number"
            });

        return params;
    }

    getModel(){
        let model = super.getModel();
        model.begin = this.begin;
        model.step = this.step;
        return model;
    }

    copy(){
        let newGen = new SinusoidalSequence(this.begin, this.step, this.a, this.b, this.c);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class CustomSequence extends Sequence{

    constructor(begin, step, sent){
        super("Custom Sequence", begin || 0, step || 1);
        this.sentence = sent || "a";
    }
    generate(){
        let value = 0;
        //eval(this.sentence);
        let str = "value=";

        if(this.sentence == "") { throw "Please, insert a sentence."}

        for (let i = 0; i < this.sentence.length; i++){
            if (this.sentence[i] === 'x'){
                if (this.count === 0)
                    str += "this.begin";
                else
                    str += "this.lastGenerated";
            }else if(this.sentence[i] === 'n'){
                str += "this.step";
            }else if (this.sentence[i] === '(' ||
                    this.sentence[i] === ')' ||
                    this.sentence[i] === '+' ||
                    this.sentence[i] === '-' ||
                    this.sentence[i] === '*' ||
                    this.sentence[i] === '/' ||
                    !isNaN(this.sentence[i])){
                str += this.sentence[i];
            }else if (this.sentence[i] === 'M' && this.sentence[i+1] === 'a' && this.sentence[i+2] === 't' && this.sentence[i+3] === 'h' && this.sentence[i+4] === '.'){
                str += "Math.";
                let j = 0;
                for (j = i+5; this.sentence[j] !== '('; j++){
                    str += this.sentence[j];
                }
                i = j-1;
            }
            else{
                str = '';
                break;
            }
        }
        str += ";";

        if (str[str.length-1] === ";"){
            console.log(str);
            eval(str);
        }

        this.count+=this.step;
        return super.generate(value);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push({
            shortName: "Sentence",
            variableName: "sentence",
            name: "Sentence",
            type: "string"
        });

        return params;
    }

    getModel(){
        let model = super.getModel();
        model.sentence = this.sentence;
        return model;
    }

    copy(){
        let newGen = new CustomSequence(this.begin, this.step, this.sentence);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class FixedTimeGenerator extends Sequence{
    constructor(initTime, step, timeMask){
        super("Fixed Time Generator");
        this.initTime = initTime || "00:00:00";
        this.strStep = step || "00:00:10";
        this.timeMask = timeMask || "HH:mm:ss";
        this.time = moment(this.initTime, this.timeMask);
        this.timeStep = moment(this.strStep, this.timeMask);
    }

    set accessInitTime(initTime){
        this.initTime = initTime;
        this.time = moment(this.initTime, this.timeMask);
    }
    get accessInitTime(){
        return this.initTime;
    }
    set accessStepTime(step){
        this.strStep = step;
        this.timeStep = moment(this.strStep, this.timeMask);
    }
    get accessStepTime(){
        return this.strStep;
    }
    set accessMaskTime(timeMask){
        this.timeMask = timeMask;
        this.time = moment(this.initTime, this.timeMask);
        this.timeStep = moment(this.strStep, this.timeMask);
    }
    get accessMaskTime(){
        return this.timeMask;
    }

    generate(){
        let v = this.time.format(this.timeMask);
        this.time.add(this.timeStep.seconds(), "s");
        this.time.add(this.timeStep.minutes(), "m");
        this.time.add(this.timeStep.hours(), "h");
        this.time.add(super.generate(0), "s");
        this.lastGenerated = v;
        return this.lastGenerated;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Init",
                variableName: "accessInitTime",
                name: "Initial Time",
                type: "string"
            },
            {
                shortName: "Step",
                variableName: "accessStepTime",
                name: "Time Step",
                type: "string"
            },
            {
                shortName: "Mask",
                variableName: "accessMaskTime",
                name: "Time Mask according to Moment.js",
                type: "string"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        model.initTime = this.initTime;
        model.strStep = this.strStep;
        model.timeMask = this.timeMask;
        return model;
    }

    copy(){
        let newGen = new FixedTimeGenerator(this.initTime, this.strStep, this.timeMask);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    reset(){
        this.time = moment(this.initTime, this.timeMask);
        this.timeStep = moment(this.strStep, this.timeMask);
        super.reset();
    }

    getReturnedType(){
        return "Time";
    }
}




class RealDataWrapper extends Generator {
    constructor(data, dataType, genType) {
        super("Real Data Wrapper");
        this.data = data || [];
        this.dataType = dataType || "Auto";
        this.genType = genType || "Standart"
        this.q1 = 25
        this.q2 = 25
        this.q3 = 25
        this.n = 10

        this.length = data.length;
        this.current = 0;

        if(!isNaN(this.data[1]) && isFinite(this.data[1])) {
            this.average = this.data.reduce((x,y) => x+y)/this.length
            this.stddev = Math.pow(this.data.reduce((x,y) => {
                return x + Math.pow(y - this.average,2)
            },0)/this.length-1,0.5)
        } else {
            let counter = {}
            this.data.forEach(data => {
                counter[data] = counter[data] ? counter[data] + 1 : 1
            })
            //Actually "Average" is a type of missing value found at Michell's dissertation. This a custom implementation. See AverageRandom for more details.
            this.average = Object.keys(counter).map(key => [key, counter[key]]).sort((a,b) => b[1] - a[1])
        }
    }

    generate() {
        const i = this.current;
        this.current++;
        this.current %= this.length;

        //TODO: Verificar se a soma dos quartis é igual a 100

        switch(this.genType) {
            case "Standart":
                return this.dataType === "Auto" ? super.generate(this.data[i]) :
                    this.dataType === "Numeric" ? parseFloat(super.generate(this.data[i])) : ""+super.generate(this.data[i]);
                break;
            case "Reverse":
                const _i = (this.length-1)-i;
                return this.dataType === "Auto" ? super.generate(this.data[_i]) :
                    this.dataType === "Numeric" ? parseFloat(super.generate(this.data[_i])) : ""+super.generate(this.data[_i]);
                break;
            case "Random":
                const rand_i = Math.round(Math.random()*(this.length-1))
                return this.dataType === "Auto" ? super.generate(this.data[rand_i]) :
                    this.dataType === "Numeric" ? parseFloat(super.generate(this.data[rand_i])) : ""+super.generate(this.data[rand_i]);
                break;
            case "QuartileRandom":
                const rand = Math.random()*100
                const { q1, q2, q3 } = this;
                let min = 0;
                let max = 0;
                if(rand < q1) {
                    min = 0; max = 0.25
                } else if(rand < q1 + q2) {
                    min = 0.25; max = 0.50
                } else if( rand < q1 + q2 + q3) {
                    min = 0.50; max = 0.75
                } else {
                    min = 0.75; max = 1
                }

                const quartile_i = Math.round((Math.random() * (max-min) + min) * (this.length-1))

                return this.dataType === "Auto" ? super.generate(this.data[quartile_i]) :
                    this.dataType === "Numeric" ? parseFloat(super.generate(this.data[quartile_i])) : ""+super.generate(this.data[quartile_i]);
                break;
            case "AverageRandom":
                //If Standart Deviation is not undefined, it's because average is a number.
                if(this.stddev) {
                    const { average, stddev } = this
                    const average_i = Math.round(Math.random() * ((average + stddev) - (average - stddev)) + (average - stddev))
                    return parseFloat(super.generate(this.data[average_i]))
                } else {
                    const mode = this.average.slice(0,this.n)
                    const mode_i = Math.round((mode.length-1)*Math.random())
                    return ""+super.generate(this.data[mode_i])
                }
                break;
        }
    }

    getModel(){
        let model = super.getModel();
        model.data = this.data;
        model.dataType = this.dataType;
        model.genType = this.genType;
        return model;
    }

    copy(){
        let newGen = new RealDataWrapper(this.data, this.dataType, this.genType);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    reset(){
        this.current = 0;
    }

    getReturnedType(){
        return this.dataType;
    }

    getReturnedGenerateType() {
        return this.genType;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Type",
                variableName: "dataType",
                name: "Force a Data Type",
                type: "options",
                options: ["Auto", "Numeric", "Categorical"]
            },
            {
                shortName: "GenType",
                variableName: "genType",
                name: "Generate Missing Values",
                type: "options",
                options: ["Standart", "Reverse", "Random", "QuartileRandom", "AverageRandom"]
            }
        );
        if(this.genType === "QuartileRandom") {
            params.push({
                    shortName: "Quartile 1",
                    variableName: "q1",
                    name: "Set Quartile 1 value",
                    type: "number"
                },
                {
                    shortName: "Quartile 2",
                    variableName: "q2",
                    name: "Set Quartile 2 value",
                    type: "number"
                },
                {
                    shortName: "Quartile 3",
                    variableName: "q3",
                    name: "Set Quartile 3 value",
                    type: "number"
                })
        }
        if(this.genType === "AverageRandom") {
            params.push({
                shortName: "N",
                variableName: "n",
                name: "[Categ.] Set N mode values",
                type: "string"
            })
        }
        return params;
    }

}



Generator.Operators = {
    "sum": (a,b) => { return a+b; },
    "multiply": (a,b) => { return a*b; },
    "modulus": (a,b) => { return a%b; },
    "divide": (a,b) => { return a/b; },
    "subtract": (a,b) => { return a-b; },
    "none": (a,b) => {return b; },
    "xor": (a,b) => {return b ? b : a}

};

Generator.Operators.sum.name = "sum";
Generator.Operators.multiply.name = "multiply";
Generator.Operators.modulus.name = "modulus";
Generator.Operators.divide.name = "divide";
Generator.Operators.subtract.name = "subtract";
Generator.Operators.none.name = "none";
Generator.Operators.xor.name = "xor";



///--------------------------  Gerenciador de Colunas e Geração da base total. ----------------------------------------

function uniqueID() {
    return (Math.random()*Date.now()/Math.random()).toString(36);
}

function copyAttrs(source, target, context){
    for(let attr in source){
        if(source.hasOwnProperty(attr) && attr !== "name"){
            if(attr === "generator2"){
                target[attr] = new (DataGen.listOfGens[source[attr].name])();
            }else if(attr === "inputGenIndex") {
                if(context.columns[source[attr]]){
                    target.inputGenerator = context.columns[source[attr]].generator;
                    target[attr] = source[attr];
                }
            }else if(attr === "listOfGenerators") {
                target[attr] = {};
                for(let attr2 in source[attr]){
                    if(source[attr].hasOwnProperty(attr2)) {
                        for (let genObj of source[attr][attr2]) {
                            //Resolve os filhos
                            let gen1 = new (DataGen.listOfGens[genObj.name])();

                            if (target[attr][attr2]) {
                                target[attr][attr2].addGenerator(gen1);
                                // gen1.parent = target;
                            } else {
                                target[attr][attr2] = gen1;
                                target[attr][attr2].parent = target;
                            }
                            copyAttrs(genObj, gen1, context);

                        }
                    }
                }
            }else{
                target[attr] = source[attr];
            }
        }
    }
}

let defaultGenerator = RandomUniformGenerator;
let defaultOperator = Generator.Operators.sum;

class Column{
    constructor(name, generator){
        this.name = name || "Col";
        this.generator = generator || new defaultGenerator();
        this.type = this.generator.getReturnedType();
        this.ID = "COL_"+uniqueID();
        this.generator.parent = this;
        this.display = true; //Variável utilizada para filtrar a dimensão de dados.
    }
}

class DataGen {

    constructor () {
        this.name = "Model";
        this.n_lines = 100; // Quantidade de linhas na geração
        this.step_lines = 10000;
        this.n_sample_lines = 10;
        this.save_as = "csv";
        this.header = true;
        this.header_type = true;
        const column = new Column("Dimension 1");
        this.columns = [column];
        this.iterator = {hasIt:false};
        this.ID = "MODEL_"+uniqueID();
        this.columnsCounter = 1; //If delete a not last column, the new colum will the same name as the last but one column and this make the preview have a bug.
        this.filePath = undefined;
        this.datagenChange = false;
        this.memento = {
            index: 0,
            snapshot: [this.exportModel()]
        };
    }

    get configs(){
        return {
            n_lines: this.n_lines,
            n_sample_lines: this.n_sample_lines,
            save_as: this.save_as,
            header: this.header,
            header_type: this.header_type,
            iterator: this.iterator
        }
    }

    set configs(obj){
        if(obj.n_lines) this.n_lines = obj.n_lines;
        if(obj.n_sample_lines) this.n_sample_lines = obj.n_sample_lines;
        if(obj.save_as) this.save_as = obj.save_as;
        if(typeof obj.header === "boolean") this.header = obj.header;
        if(typeof obj.header_type === "boolean") this.header_type = obj.header_type;
        if(obj.iterator){
            let found = false;
            findGen_block: {
                for (let col of this.columns) {
                    if (col.ID === obj.iterator.generatorIt.colID) {
                        for (let gen of col.generator.getFullGenerator()) {
                            if (gen.ID === obj.iterator.generatorIt.genID) {
                                obj.iterator.generator = gen;
                                found = true;
                                break findGen_block;
                            }
                        }
                    }
                }
            }
            if(found)
                this.iterator = obj.iterator;
        }
    }

    getColumnsNames(){
        let names = [];
        for(let col of this.columns){
            names.push(col.name);
        }
        return names;
    }

    getDisplayedColumnsNames() {
        let names = [];
        for(let col of this.columns){
            if(col.display)
                names.push(col.name);
        }
        return names;
    }

    addColumn(name, generator){
        generator = generator || new defaultGenerator();
        let column = new Column(name, generator);
        this.columns.push(column);
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

    removeColumn(index){

        let removeFunc = (g) => {
            if(g instanceof Function) {
                if (g.inputGenIndex > index) {
                    g.inputGenIndex--;
                }else if (g.inputGenIndex === index) {
                    g.inputGenIndex = undefined;
                    g.inputGenerator = undefined
                }
            }
            if(g instanceof SwitchCaseFunction){
                for(let child in g.listOfGenerators){
                    if(g.listOfGenerators.hasOwnProperty(child)){
                        removeFunc(g.listOfGenerators[child]);
                    }
                }
            }
        };

        if (index > -1)
            this.columns.splice(index, 1);

        //Atualiza o indexOfGens de todos as Function que estejam em colunas depois
        for(let i=index;i<this.columns.length; i++){
            let gens = this.columns[i].generator.getFullGenerator();

            for(let g of gens){
                removeFunc(g);
            }
        }
    }

    generateSample(){
        let lb = this.n_lines;
        let sb = this.save_as;
        let hb = this.header;
        this.n_lines = this.n_sample_lines;
        this.save_as = "csv";
        this.header = true;
        let sampleData = this.generate();
        this.n_lines = lb;
        this.save_as = sb;
        this.header = hb;
        return sampleData;
    }

    generate (quantity=NaN) {
        //TODO: pedir uma quantidade exata de dados para serem gerados e associar isso com as configurações ao lado do Generate na Tela Inicial.
        let data = [];
        const numberLines = 
            Number(quantity) ?
                quantity > this.step_lines ? 
                    this.step_lines 
                : quantity
            : this.n_lines;
            
        for (let i = 0; i < numberLines; i++){
            data.push( this.save_as === "json" && !this.header ? [] : {});
            for (let j = 0; j < this.columns.length; j++){
                if(this.columns[j].display) {
                    if(this.save_as === "json" && !this.header){
                        data[i].push(this.columns[j].generator.generate());
                    } else {
                        data[i][this.columns[j].name] = this.columns[j].generator.generate();
                    }
                }
            }
        }
        this.resetAll();
        return data;
    }

    resetAll (){
        for (let j = 0; j < this.columns.length; j++){
            this.columns[j].generator.reset();
        }
    }

    exportModel(){
        let model = {
            name: this.name,
            generator: [],
            n_lines: this.n_lines,
            step_lines: this.step_lines,
            columnsCounter: this.columnsCounter,
            save_as: this.save_as,
            header: this.header,
            header_type: this.header_type
        };
        for(let i=0; i<this.columns.length; i++){
            model.generator.push({
                name: this.columns[i].name,
                type: this.columns[i].type,
                ID: this.columns[i].ID,
                display: this.columns[i].display
            });
            let fullGenerator = [];
            let fullGenNames = [];
            this.columns[i].generator.getFullGenerator(fullGenerator);
            for(let gen of fullGenerator){
                fullGenNames.push(gen.getModel());
            }
            model.generator[i].generator = fullGenNames;
        }
        return JSON.stringify(model);
    }

    //TODO: resolver funções e ruido.
    importModel(model_str, resetColumns) {
        let model = JSON.parse(model_str);
        if(model.generator[0].generator[0].name === "Real Data Wrapper") {throw new Error('Real Data Wrapper is strange!')}
        this.name = model.name || this.name;
        this.n_lines = model.n_lines || this.n_lines;
        this.step_lines = modal.step_lines || this.step_lines;
        this.columnsCounter = model.columnsCounter;
        this.save_as = model.save_as || this.save_as;
        this.header = model.header || this.header;
        this.header_type = model.header_type || this.header_type;

        if(resetColumns)
            this.columns = [];

        for(let i=0; i < model.generator.length; i++){
            let generator;
            for(let j=0; j<model.generator[i].generator.length; j++){
                let selectedGenerator = DataGen.listOfGens[model.generator[i].generator[j].name];
                if (generator){
                    let newgen = new selectedGenerator();
                    generator.addGenerator(newgen);
                    copyAttrs(model.generator[i].generator[j], newgen, this);
                }else {
                    generator = new selectedGenerator();
                    copyAttrs(model.generator[i].generator[j], generator, this);
                }

            }

            generator.reset();
            let col = new Column(model.generator[i].name, generator);
            col.ID = model.generator[i].ID || col.ID;
            col.display = model.generator[i].display === undefined ? col.display : model.generator[i].display;
            this.columns.push(col);
        }
    }

    saveState() {

        if(this.memento.index !== this.memento.snapshot.length-1) {
            let remove = this.memento.snapshot.length - (this.memento.index + 1);
            this.memento.snapshot.splice(this.memento.index+1,remove);
        }
        if(this.memento.snapshot.length === 500) {
            this.memento.snapshot.pop(0);
        } else {
            this.memento.index++;
        }
        this.memento.snapshot.push(this.exportModel());
        //console.log(this.memento,"State");
    }

    forward() {
        if(this.memento.index !== this.memento.snapshot.length-1) {
            this.importModel(this.memento.snapshot[++this.memento.index], true);
            //console.log(this.memento,"Forward");
        }
    }

    restore() {
        if(this.memento.index !== 0) {
            this.importModel(this.memento.snapshot[--this.memento.index], true);
            //console.log(this.memento,"Restore");
        }
    }

    exportDot(){

        function drawGenerators(ref, col, i, pkey){
            let fullListOfGens = [];
            col.generator.getFullGenerator(fullListOfGens);
            for(let j=0;j<fullListOfGens.length;j++){
                let params = fullListOfGens[j].getGenParams();
                ref.str += "col_"+i+"_"+col.name.replace(/\s+/g,"_") +"_"+fullListOfGens[j].name.replace(/\s+/g,"_")+"_"+j
                    + ' [label=< <table border="0" cellborder="0"><tr><td align="center"><B><FONT point-size="14">'+fullListOfGens[j].name+'</FONT></B></td></tr>';

                for(let param of params){
                    if(param.type === "array" || param.type === "numarray"){
                        ref.str += '<tr><td align="left">&#8226; '+param.shortName+' = &#91;</td></tr>';
                        for(let arrItem of fullListOfGens[j][param.variableName])
                            ref.str += '<tr><td align="left">'+arrItem+',</td></tr>';
                        ref.str+='<tr><td align="left">&#93;</td></tr>';

                        }else if(param.type === "Generator"){
                            ref.str += '<tr><td align="left">&#8226; '+param.shortName+' = generator('+fullListOfGens[j][param.variableName].name+')</td></tr>';
                        }else if(param.type.indexOf("Column") >= 0){
                            ref.str += '<tr><td align="left">&#8226; '+param.shortName+' = column('+fullListOfGens[j][param.variableName].parent.name+')</td></tr>';
                    }else{
                        ref.str += '<tr><td align="left">&#8226; '+param.shortName+' = '+fullListOfGens[j][param.variableName]+'</td></tr>';
                    }
                }
                ref.str += "</table> >] ; \n";


                if(fullListOfGens[j] instanceof  SwitchCaseFunction){
                    for(let key in fullListOfGens[j].listOfGenerators){
                        if(fullListOfGens[j].listOfGenerators.hasOwnProperty(key)){
                            // str += "col_"+i+"_"+fullListOfGens[j].name.replace(/\s+/g,"_")+"_child_"+key.replace(/\s+/g,"_").replace(/\W+/g,"")
                            //     + ' [label=< <B><FONT point-size="14">'+fullListOfGens[j].listOfGenerators[key].name+'</FONT></B> >]\n';
                            let keyForID = (pkey?pkey+"_":"") + key.replace("<","lt").replace(">","gt").replace(/\s+/g,"_").replace(/\W+/g,"");
                            let refobj = {str: ref.str, edges: ref.edges};
                            drawGenerators(refobj, {
                                name: "child_"+keyForID,
                                generator: fullListOfGens[j].listOfGenerators[key]
                            }, i, (pkey?pkey+"_":"") + j);
                            ref.str = refobj.str;
                            ref.edges = refobj.edges;
                            ref.edges += "col_"+i+"_"+col.name.replace(/\s+/g,"_") +"_"+fullListOfGens[j].name.replace(/\s+/g,"_")+"_"+j
                                + ' -> '+"col_"+i+"_"+ "child_"+keyForID +"_"+fullListOfGens[j].listOfGenerators[key].name.replace(/\s+/g,"_")+"_0"+
                                '[label="case: '+key+'"]; \n';
                        }
                    }
                    break;
                }else{
                    if(fullListOfGens[(j+1)])
                        ref.edges += "col_"+i+"_"+col.name.replace(/\s+/g,"_") +"_"+fullListOfGens[j].name.replace(/\s+/g,"_")+"_"+j
                            + ' -> '+"col_"+i+"_"+col.name.replace(/\s+/g,"_") +"_"+fullListOfGens[(j+1)].name.replace(/\s+/g,"_")+"_"+ (j+1) +"; \n";
                }


            }
        }

        let str = 'digraph { \n node [shape=box,fontsize=12,fontname="Verdana"];\n graph [fontsize=12,fontname="Verdana",compound=true]; \n';
        let edges = "";
        for(let i=0;i<this.columns.length;i++){
            let col = this.columns[i];
            str += "col_"+i+"_"+col.name.replace(/\s+/g,"_")
                +' [label=< <table border="0" cellborder="0"><tr><td align="center"><B><FONT point-size="14">'
                +col.name +'</FONT></B></td></tr><tr><td align="left">&#8226; type = "'+ col.type +'"</td></tr></table> > ]; \n';
        }
        str += "\n";
        for(let i=0;i<this.columns.length;i++){
            let col = this.columns[i];


            edges += "col_"+i+"_"+col.name.replace(/\s+/g,"_") + "-> col_"+i+"_"+col.name.replace(/\s+/g,"_") +"_"+col.generator.name.replace(/\s+/g,"_")+"_"+0
                +' [lhead='+'cluster_'+i+'_'+col.name.replace(/\s+/g,"_")+',minlen="2"] ; \n';
            str +='subgraph cluster_'+i+'_'+col.name.replace(/\s+/g,"_")+' { \n';
            str += 'label="List of Generators";\n';
            let refobj = {str, edges};
            drawGenerators(refobj, col, i);
            str = refobj.str;
            edges = refobj.edges;
            str +='} \n\n';
        }

        str  += edges + "\n";

        str += "}";
        return str;
    }

    findGenByID(ID){
        let dfs = (gen) =>{
            let full_gen = gen.getFullGenerator();

            for(let j=0; j<full_gen.length; j++){
                console.log(full_gen[j].ID, ID);
                if(full_gen[j].ID === ID)
                    return full_gen[j];

                if(full_gen[j] instanceof SwitchCaseFunction){
                    for(let attr in full_gen[j].listOfGenerators){
                        if(full_gen[j].listOfGenerators.hasOwnProperty(attr)){
                            let found = dfs(full_gen[j].listOfGenerators[attr]);
                            if(found) return found;
                        }
                    }
                }
            }

        };
        for(let i=0; i<this.columns.length; i++){
            let found = dfs(this.columns[i].generator);
            if(found) return found;
        }
    }

}


DataGen.listOfGens = {
    'Constant Value': ConstantValue,
    'MCAR': MCAR,
    'MAR': MAR,
    'MNAR': MNAR,
    'Counter Generator': CounterGenerator,
    'Fixed Time Generator': FixedTimeGenerator,
    'Poisson Time Generator': PoissonTimeGenerator,
    'Uniform Generator': RandomUniformGenerator,
    'Gaussian Generator': RandomGaussianGenerator,
    'Poisson Generator': RandomPoissonGenerator,
    'Bernoulli Generator': RandomBernoulliGenerator,
    'Cauchy Generator': RandomCauchyGenerator,
    'Noise Generator': RandomNoiseGenerator,
    'Constant Noise Generator': RandomConstantNoiseGenerator,
    'Range Filter': RangeFilter,
    'Linear Scale': LinearScale,
    'No Repeat': NoRepeat,
    'MinMax': MinMax,
    'Low-Pass Filter': LowPassFilter,
    'Weighted Categorical': RandomWeightedCategorical,
    'Categorical': RandomCategorical,
    'Categorical Quantity': RandomCategoricalQtt,
    'Linear Function': LinearFunction,
    'Quadratic Function': QuadraticFunction,
    'Polynomial Function': PolynomialFunction,
    'Exponential Function': ExponentialFunction,
    'Logarithm Function': LogarithmFunction,
    'Sinusoidal Function': SinusoidalFunction,
    'Categorical Function': CategoricalFunction,
    'Piecewise Function': PiecewiseFunction,
    'TimeLaps Function': TimeLapsFunction,
    'Sinusoidal Sequence': SinusoidalSequence,
    'Custom Sequence': CustomSequence,
    'CubicBezier Generator': CubicBezierGenerator,
    'Path2D Stroke Generator': Path2DStrokeGenerator,
    'Path2D Fill Generator': Path2DFillGenerator,
    'Get Extra Value': GetExtraValue
};

DataGen.listOfGensHelp = {
    'Constant Value': "Generate a sequence with only one constant number.",
    'MCAR': "Introduce values Missing Completely At Random.",
    'MAR': "Introduce values Missing At Random.",
    'MNAR': "Introduce values Missing Not At Random.",
    'Counter Generator': "Generate a sequence counting Step by Step from Begin.",
    'Fixed Time Generator': FixedTimeGenerator,
    'Poisson Time Generator': PoissonTimeGenerator,
    'Uniform Generator': "Generate random data distributed evenly.",
    'Gaussian Generator': RandomGaussianGenerator,
    'Poisson Generator': RandomPoissonGenerator,
    'Bernoulli Generator': RandomBernoulliGenerator,
    'Cauchy Generator': RandomCauchyGenerator,
    'Noise Generator': RandomNoiseGenerator,
    'Constant Noise Generator': RandomConstantNoiseGenerator,
    'Range Filter': RangeFilter,
    'Linear Scale': LinearScale,
    'No Repeat': "Generate distinct values.",
    'MinMax': MinMax,
    'Low-Pass Filter': LowPassFilter,
    'Weighted Categorical': "Almost the same as Categorical, but the names have probability to appear.",
    'Categorical': "Generate random data using names.",
    'Categorical Quantity': "Almost the same as Categorical, but each name have a fixed quantity.",
    'Linear Function': LinearFunction,
    'Quadratic Function': QuadraticFunction,
    'Polynomial Function': PolynomialFunction,
    'Exponential Function': ExponentialFunction,
    'Logarithm Function': LogarithmFunction,
    'Sinusoidal Function': SinusoidalFunction,
    'Categorical Function': "Using categorical inputs to generate values.",
    'Piecewise Function': PiecewiseFunction,
    'TimeLaps Function': TimeLapsFunction,
    'Sinusoidal Sequence': "Generate values in a sinusoidal sequence.",
    'Custom Sequence': "Generate values using a custom sequence.",
    'CubicBezier Generator': CubicBezierGenerator,
    'Path2D Stroke Generator': Path2DStrokeGenerator,
    'Get Extra Value': "Useful for generators the return multidimensional values.",
    'Real Data Wrapper' : "Generator to receice data from real dataset."
};

DataGen.listOfGensForNoise = {
    'Uniform Generator': RandomUniformGenerator,
    'Gaussian Generator': RandomGaussianGenerator,
    'Poisson Generator': RandomPoissonGenerator,
    'Bernoulli Generator': RandomBernoulliGenerator,
    'Cauchy Generator': RandomCauchyGenerator,
};

DataGen.listOfGensComplete = {
    'Real Data Wrapper' : RealDataWrapper
};
for(let attr in DataGen.listOfGens){
    if(DataGen.listOfGens.hasOwnProperty(attr))
        DataGen.listOfGensComplete[attr] = DataGen.listOfGens[attr];
}


DataGen.superTypes = {
    Generator,
    Function,
    SwitchCaseFunction,
    Sequence,
    Random,
    Accessory,
    Geometric,
    Column
};

DataGen.Utils = {
    decodeSvgPathD: (str)=>{
        let commands = str.match(/[ACLMZaclmz][^ACLMZaclmz]*/g);
        let params, quant;
        let lastPoint = [0,0];
        let output = [];
        let init = [0,0];

        for(let c of commands){
            switch (c[0]){
                case "A":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    output.push({command: "A", params: [+params[0], +params[1], +params[2], +params[3], +params[4], +params[5], +params[6]]});
                    break;
                case "M":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    if(params.length > 2){
                        init[0] = lastPoint[0] = +params.shift();
                        init[1] = lastPoint[1] = +params.shift();
                        output.push({command:"M", params: [lastPoint[0], lastPoint[1]]});
                    }
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] = +params[i*2];
                        lastPoint[1] = +params[i*2+1];
                        output.push({command:"L", params: [lastPoint[0],lastPoint[1]]});
                    }
                    break;

                case "m":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    if(params.length > 2){
                        init[0] = lastPoint[0] += +params.shift();
                        init[1] = lastPoint[1] += +params.shift();
                        output.push({command:"M", params: [lastPoint[0], lastPoint[1]]});
                    }
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] += +params[i*2];
                        lastPoint[1] += +params[i*2+1];
                        output.push({command:"L", params: [lastPoint[0],lastPoint[1]]});
                    }
                    break;

                case "L":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] = +params[i*2];
                        lastPoint[1] = +params[i*2+1];
                        output.push({command:"L", params: [lastPoint[0],lastPoint[1]]});
                    }
                    break;

                case "l":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/2;
                    for(let i=0;i<quant;i++){
                        lastPoint[0] += +params[i*2];
                        lastPoint[1] += +params[i*2+1];
                        output.push({command:"L", params: [lastPoint[0],lastPoint[1]]});
                    }
                    break;

                case "C":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/6;
                    for(let i=0;i<quant;i++){
                        let x1 = +params[i*6], y1 = +params[i*6+1];
                        let x2 = +params[i*6+2], y2 = +params[i*6+3];
                        let x3 = +params[i*6+4], y3 = +params[i*6+5];
                        output.push({command:"C", params: [x1,y1,x2,y2,x3,y3]});
                        lastPoint[0]=x3;
                        lastPoint[1]=y3;
                    }
                    break;
                case "c":
                    params = c.substring(1).trim().split(/[,\s]+/);
                    quant = params.length/6;
                    for(let i=0;i<quant;i++){
                        let x1 = lastPoint[0] + (+params[i*6]), y1 = lastPoint[1] + (+params[i*6+1]);
                        let x2 = x1 + (+params[i*6+2]), y2 = y1 + (+params[i*6+3]);
                        let x3 = x2 + (+params[i*6+4]), y3 = y2 + (+params[i*6+5]);
                        output.push({command:"C", params: [x1,y1,x2,y2,x3,y3]});
                        lastPoint[0]=x3;
                        lastPoint[1]=y3;
                    }
                    break;

                case "z":
                case "Z":
                    output.push({command:"Z", params: [init[0], init[1]]});
                    lastPoint[0] = init[0];
                    lastPoint[1] = init[1];
                    break;
            }
        }

        return output;
    }
};

//var datagen = new DataGen();
var DataGenerator = DataGen;


if(module){
    // module.exports.CounterGenerator =         CounterGenerator;
    // module.exports.RandomGaussGenerator =     RandomGaussianGenerator;
    // module.exports.RandomPoissonGenerator =   RandomPoissonGenerator;
    // module.exports.RandomBernoulliGenerator = RandomBernoulliGenerator;
    // module.exports.RandomCauchyGenerator =    RandomCauchyGenerator;
    // module.exports.RandomNoiseGenerator =     RandomNoiseGenerator;
    module.exports = DataGen;
}
