

let randgen = require("randgen");
let moment = require("moment");


class Generator{
    constructor(name){
        this.name = name;
        this.operator = defaultOperator;
        this.order = 0;
        this.ID = "GEN_"+uniqueID();
    }

    addGenerator(gen, order){
        if (this.generator){
            this.generator.addGenerator(gen, (order || this.order) + 1);
        } else {
            gen.order = (order || this.order) + 1;
            this.generator = gen;
            gen.parent = this;
        }
    }

    sumOrder(){
        this.order++;
        if (this.generator) this.generator.sumOrder();
    }

    insertGenerator(gen){
        gen.order = this.order;

        if (this.generator){
            this.generator.parent = gen;
            gen.parent = this;

            let aux = this.generator;
            this.generator = gen;
            gen.generator = aux;
        }else{
            this.generator = gen;
        }
        this.generator.sumOrder();
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
            console.log("parent", gen.parent);
            console.log("gen", gen);
            for(let cat in gen.parent.listOfGenerators){
                if(gen.parent.listOfGenerators.hasOwnProperty(cat) && gen.parent.listOfGenerators[cat] === this)
                    gen.parent.listOfGenerators[cat] = gen;
            }
        }
        // let genSub = this.generator.generator;
        // this.generator = gen;
        // this.generator.generator = genSub;
        //
        // return true;
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
                options: ["sum", "multiply", "modulus", "divide", "subtract"]
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
     * Retorna o genrador com seus parâmetros para ser serializado pelo JSON.stringify().
     * Ou seja, sem funções e referências a outros objetos.
     * Este método deve ser sobreposto nas subclasses para persistência das variáveis específicas de cada subtipo
     * de gerador.
     *
     * @returns object - Objeto do gerador pronto para serialização via JSON.stringify().
     */
    getModel(){
        return {
            name: this.name,
            order: this.order
        }
    }

    getReturnedType(){
        return "Numeric";
    }

    copy(){

    }
}

class ConstantValue extends Generator{

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
}

class MissingValue extends Generator{

    constructor(value, probability){
        super("Missing Value");
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
        let newGen = new MissingValue(this.value, this.probability);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class RandomUniformGenerator extends Generator{
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

class RandomGaussianGenerator extends Generator{
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

class RandomPoissonGenerator extends Generator{
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

class RandomBernoulliGenerator extends Generator{
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

class RandomCauchyGenerator extends Generator{
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


class FixedTimeGenerator extends Generator{
    constructor(initTime, step, timeMask){
        super("Fixed Time Generator");
        this.initTime = initTime || "00:00:00";
        this.step = step || "00:00:10";
        this.timeMask = timeMask || "HH:mm:ss";
        this.time = moment(this.initTime, this.timeMask);
        this.timeStep = moment(this.step, this.timeMask);
    }

    set accessInitTime(initTime){
        this.initTime = initTime;
        this.time = moment(this.initTime, this.timeMask);
    }
    get accessInitTime(){
        return this.initTime;
    }
    set accessStepTime(step){
        this.step = step;
        this.timeStep = moment(this.step, this.timeMask);
    }
    get accessStepTime(){
        return this.step;
    }
    set accessMaskTime(timeMask){
        this.timeMask = timeMask;
        this.time = moment(this.initTime, this.timeMask);
        this.timeStep = moment(this.step, this.timeMask);
    }
    get accessMaskTime(){
        return this.timeMask;
    }

    generate(){
        let v = this.time.format(this.timeMask);
        console.log(v);
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
        model.step = this.step;
        model.timeMask = this.timeMask;
        return model;
    }

    copy(){
        let newGen = new FixedTimeGenerator(this.initTime, this.step, this.timeMask);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    reset(){
        this.time = moment(this.initTime, this.timeMask);
        this.timeStep = moment(this.step, this.timeMask);
        super.reset();
    }

    getReturnedType(){
        return "Time";
    }
}

class PoissonTimeGenerator extends Generator{
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

class RandomConstantNoiseGenerator extends Generator{
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

class RandomNoiseGenerator extends Generator{
    constructor(probability, intensity, generator2){
        super("Noise Generator");
        this.generator2 = generator2 || new defaultGenerator();
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
    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Type",
                variableName: "generator2",
                name: "Generator Type",
                type: "Generator"
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

class RangeFilter extends Generator {
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

class LinearScale extends Generator {
    constructor(minDomain,maxDomain, minRange, maxRange) {
        super("Linear Scale");
        this.minDomain = minDomain;
        this.maxDomain = maxDomain;
        this.minRange = minRange;
        this.maxRange = maxRange;
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

class MinMax extends Generator {
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

class LowPassFilter extends Generator {
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


class RealDataWrapper extends Generator {
    constructor(data, dataType) {
        super("Real Data Wrapper");
        this.data = data || [];
        this.dataType = dataType || "Auto";

        this.length = data.length;
        this.current = 0;
    }

    generate() {
        let i = this.current;
        this.current++;
        this.current %= this.length;
        return this.dataType === "Auto" ? super.generate(this.data[i]) :
            this.dataType === "Numeric" ? parseFloat(super.generate(this.data[i])) : ""+super.generate(this.data[i]);
    }

    getModel(){
        let model = super.getModel();
        model.data = this.data;
        model.dataType = this.dataType;
        return model;
    }

    copy(){
        let newGen = new RealDataWrapper(this.data, this.dataType);
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

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Type",
                variableName: "dataType",
                name: "Force a Data Type",
                type: "options",
                options: ["Auto", "Numeric", "Categorical"]
            }
        );
        return params;
    }

}

class RandomCategorical extends Generator {
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

class RandomCategoricalQtt extends Generator {
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

class RandomWeightedCategorical extends Generator {
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

    }
}

class LinearFunction extends Function{
    constructor(a, b, inputGenerator){
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
        let newGen = new LinearFunction(this.a, this.b);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class QuadraticFunction extends Function{
    constructor(a, b, c, inputGenerator){
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
        let newGen = new QuadraticFunction(this.a, this.b, this.c);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class PolynomialFunction extends Function{
    constructor(constants, inputGenerator){
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
        let newGen = new PolynomialFunction(this.constants);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class ExponentialFunction extends Function{
    constructor(a, b, inputGenerator){
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
        let newGen = new ExponentialFunction(this.a, this.b);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class LogarithmFunction extends Function{
    constructor(base, inputGenerator){
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
        let newGen = new LogarithmFunction(this.base);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class SinusoidalFunction extends Function{
    constructor(a, b, c, inputGenerator){
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
        let newGen = new SinusoidalFunction(this.a, this.b, this.c);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class SwitchCaseFunction extends Function{
    constructor(name, listOfGenerators, inputGenerator){
        super(name, inputGenerator);
        this.listOfGenerators = listOfGenerators || {};
        this.inputArray = [];
    }

    reset(){
        if (!this.inputGenerator)
            return;
        let auxgen = new RandomUniformGenerator();
        this.generator = auxgen;
        auxgen.parent = this;

        let attrs = [];
        for(let attr in this.listOfGenerators)
            if(this.listOfGenerators.hasOwnProperty(attr))
                attrs.push(attr);
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

}

class CategoricalFunction extends SwitchCaseFunction{
    constructor(listOfGenerators, inputGenerator){
        super("Categorical Function", listOfGenerators, inputGenerator);
    }

    getGenParams() {
        let params = super.getGenParams();
        params[0].type = "CategoricalColumn";
        return params;
    }

    reset(){
        if (!this.inputGenerator)
            return;
        this.inputArray = this.inputGenerator.array;
        super.reset();
    }


    copy(){
        let newList = {};
        //Copia a lista de Geradores
        for(let prop in this.listOfGenerators)
            if(this.listOfGenerators.hasOwnProperty(prop))
                newList[prop] = this.listOfGenerators[prop].copy();
        let newGen = new CategoricalFunction(newList, this.inputGenerator);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }
}

class TimeLapsFunction extends SwitchCaseFunction{
    constructor(laps, listOfGenerators, inputGenerator){
        super("TimeLaps Function", listOfGenerators, inputGenerator);
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
        params[0].type = "TimeColumn";
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
        let newList = {};
        //Copia a lista de Geradores
        for(let prop in this.listOfGenerators)
            if(this.listOfGenerators.hasOwnProperty(prop))
                newList[prop] = this.listOfGenerators[prop].copy();
        // laps, timeMask, listOfGenerators, inputGenerator, generator, operator
        let newGen = new TimeLapsFunction(this.laps, newList, this.inputGenerator);
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
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

//TODO: Precisa dessa variável? Se não, remover...
var auxiliary = 0;
class CustomSequence extends Sequence{

    constructor(begin, step, sent){
        super("Custom Sequence", begin || 0, step || 1);
        this.sentence = sent || "";
    }

    generate(){
        let value = 0;
        //eval(this.sentence);
        let str = "value=";

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




Generator.Operators = {
    "sum": (a,b) => { return a+b; },
    "multiply": (a,b) => { return a*b; },
    "modulus": (a,b) => { return a%b; },
    "divide": (a,b) => { return a/b; },
    "subtract": (a,b) => { return a-b; }
};
Generator.Operators.sum.name = "sum";
Generator.Operators.multiply.name = "multiply";
Generator.Operators.modulus.name = "modulus";
Generator.Operators.divide.name = "divide";
Generator.Operators.subtract.name = "subtract";



///--------------------------  Gerenciador de Colunas e Geração da base total. ----------------------------------------

function uniqueID() {
    return Date.now().toString(36);
}

function copyAttrs(source, target, context){
    for(let attr in source){
        if(source.hasOwnProperty(attr) && attr !== "name"){
            if(attr === "generator2"){
                target[attr] = new (DataGen.listOfGens[source[attr]])();
            }else if(attr === "inputGenIndex") {
                target.inputGenerator = context.columns[source[attr]].generator;
                target[attr] = source[attr];
            }else if(attr === "listOfGenerators") {
                target[attr] = {};
                for(let attr2 in source[attr]){
                    if(source[attr].hasOwnProperty(attr2))
                        for(let genObj of source[attr][attr2]){
                            //Resolve os filhos
                            let gen1 = new (DataGen.listOfGens[genObj.name])();
                            console.log(target[attr][attr2]);
                            if(target[attr][attr2]) {
                                target[attr][attr2].addGenerator(gen1);
                                // gen1.parent = target;
                            }else {
                                target[attr][attr2] = gen1;
                                target[attr][attr2].parent = target;
                            }
                            //Copia os atributos desse filho.
                            for (let t in genObj){
                                if(genObj.hasOwnProperty(t))
                                    gen1[t] = genObj[t];
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
    }
}

class DataGen {

    constructor () {
        this.name = "Model";
        this.n_lines = 100; // Quantidade de linhas na geração
        this.n_sample_lines = 100;
        this.save_as = "csv";
        this.header = true;
        this.header_type = true;
        let column = new Column("Dimension 1");
        this.columns = [column];
        this.iterator = {hasIt:false};
        this.ID = "MODEL_"+uniqueID();
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


    addCollumn(name, generator){
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

    removeCollumn(index){
        if (index > -1)
            this.columns.splice(index, 1);
    }


    generateSample(){
        let lb = this.n_lines;
        let sb = this.save_as;
        let hb = this.header;
        this.n_lines = this.n_sample_lines;
        this.save_as = "json";
        this.header = true;
        let sampleData = this.generate();
        this.n_lines = lb;
        this.save_as = sb;
        this.header = hb;
        return sampleData;
    }

    generate (){
        let data = [];
        if(this.save_as === "json" && !this.header){
            for (let i = 0; i < this.n_lines; i++){
                data.push([]);
                for (let j = 0; j < this.columns.length; j++){
                    data[i].push(this.columns[j].generator.generate());
                }
            }
        }else{
            for (let i = 0; i < this.n_lines; i++){
                data.push({});
                for (let j = 0; j < this.columns.length; j++){
                    data[i][this.columns[j].name] = this.columns[j].generator.generate();
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
            generator: []
        };
        for(let i=0; i<this.columns.length; i++){
            model.generator.push({
                name: this.columns[i].name,
                type: this.columns[i].type,
            });
            let fullGenerator = [];
            let fullGenNames = [];
            this.columns[i].generator.getFullGenerator(fullGenerator);
            for(let gen of fullGenerator){
                fullGenNames.push(gen.getModel());
            }
            model.generator[i].generator = fullGenNames;
        }
        //console.log(JSON.stringify(model));
        return JSON.stringify(model);
    }

    //TODO: resolver funções e ruido.
    importModel(model_str){
        let model = JSON.parse(model_str);
        this.name = model.name;

        for(let i=0; i<model.generator.length; i++){

            let generator;

            for(let j=0; j<model.generator[i].generator.length; j++){
                let selectedGenerator = DataGen.listOfGens[model.generator[i].generator[j].name];
                if(generator){
                    let newgen = new selectedGenerator();
                    generator.addGenerator(newgen);
                    copyAttrs(model.generator[i].generator[j], newgen, this);
                }else{
                    generator = new selectedGenerator();
                    copyAttrs(model.generator[i].generator[j], generator, this);
                }
            }

            generator.reset();
            let col = new Column(model.generator[i].name, generator);
            this.columns.push(col);
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




}

MissingValue.genType = "Accessory";
RandomNoiseGenerator.genType = "Accessory";
RandomConstantNoiseGenerator.genType = "Accessory";
RangeFilter.genType = "Accessory";
LinearScale.genType = "Accessory";
MinMax.genType = "Accessory";
LowPassFilter.genType = "Accessory";
LinearFunction.genType = "Function";
QuadraticFunction.genType = "Function";
PolynomialFunction.genType = "Function";
ExponentialFunction.genType = "Function";
LogarithmFunction.genType = "Function";
SinusoidalFunction.genType = "Function";
CategoricalFunction.genType = "Function";
TimeLapsFunction.genType = "Function";
PoissonTimeGenerator.genType = "Random";
RandomUniformGenerator.genType = "Random";
RandomGaussianGenerator.genType = "Random";
RandomPoissonGenerator.genType = "Random";
RandomBernoulliGenerator.genType = "Random";
RandomCauchyGenerator.genType = "Random";
RandomWeightedCategorical.genType = "Random";
RandomCategorical.genType = "Random";
RandomCategoricalQtt.genType = "Random";
FixedTimeGenerator.genType = "Sequence";
ConstantValue.genType = "Sequence";
CounterGenerator.genType = "Sequence";
SinusoidalSequence.genType = "Sequence";
CustomSequence.genType = "Sequence";

DataGen.listOfGens = {
    'Constant Value': ConstantValue,
    'Missing Value': MissingValue,
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
    'TimeLaps Function': TimeLapsFunction,
    'Sinusoidal Sequence': SinusoidalSequence,
    'Custom Sequence': CustomSequence
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
    Sequence
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
