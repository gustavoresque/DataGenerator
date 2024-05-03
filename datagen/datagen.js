
let randgen = require("randgen");
let seedrandom = require("seedrandom");
let originalRandom = Math.random;
let moment = require("moment");

//TODO: adicionar o destructuring assignment em todo projeto, exemplos em: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment

class Generator{
    constructor(){
        if(this instanceof SwitchCaseFunction)
            this.operator = Generator.Operators.none;
        else
            this.operator = defaultOperator;
        this.order = 0;
        this.ID = "GEN_"+DataGen.Utils.getID();
    }

    addGenerator(gen){
        if (this.generator){
            this.generator.addGenerator(gen);
        } else {
            gen.order = this.order+1;
            this.generator = gen;
            gen.parent = this;
            gen.dataGen = this.dataGen;
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
            if(this.parent instanceof SwitchCaseFunction) {
                this.parent.unlinkChild(this);
            }
            if(this.generator){
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

        gen.dataGen = this.dataGen;
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
        gen.dataGen = this.dataGen;
        //é filho de SwitchCaseFunction e está na listOfGenerators
        //ou seja não é filho direto e sim da lista de cases
        if(this.parent instanceof SwitchCaseFunction && this.parent.generator !== this){
            for(let attr in this.parent.listOfGenerators){
                let genOfList = this.parent.listOfGenerators[attr];
                if(genOfList === this){
                    if(genOfList === gen) return;

                    this.parent.listOfGenerators[attr] = gen;

                    gen.parent = genOfList.parent;
                    gen.generator = genOfList;

                    genOfList.parent = gen;
                    break;
                }
            }
        }else if(this.parent instanceof Generator) {
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

    /**
     * Troca o gerador atual na cadeia pelo gerador passado por parâmentro.
     * O gerador em que foi chamado o método sairá da sua cadeia de geradores.
     * @param gen O gerador que assumirá o lugar do gerador em que foi chamado o método.
     */
    changeGenerator(gen){
        gen.dataGen = this.dataGen;
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

    /**
     * Entrada: sub_value - valor que será combinado com o gerado através (ou não) de um operador
     * Saída: lastGenerated - valor gerado pelo Generator
     * Recebe um valor que é inserido no operador juntamente com um segundo valor gerado pelo Generator inserido neste.
     * Caso não exista um operador, o valor inserido é somado ao valor gerado e retornado
     */
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
                options: ["sum", "multiply", "modulus", "divide", "subtract", "none"]
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
        let attrs = DataGen.Utils.funcArgs(this.constructor);
        let model = {
            name: this.constructor.displayName,
            order: this.order,
            ID: this.ID,
            accessOperator: this.accessOperator
        };
        attrs.forEach(attr=>model[attr]=this[attr])
        return model;
    }

    getReturnedType(){
        return "Numeric";
    }

    copy(){
        let attrs = DataGen.Utils.funcArgs(this.constructor);
        let newGen = new this.constructor(...attrs.map(attr=>this[attr]));
        if (this.generator){
            newGen.addGenerator(this.generator.copy(), this.order);
        }
        return newGen;
    }

    getEstimatedRange(){

    }

    afterGenerate(){
        if(this.generator)
            this.generator.afterGenerate();
    }
}

class Random extends Generator{
}

class RandomUniformGenerator extends Random{
    constructor(min=0, max=1, disc=false){
        super();
        this.min = min;
        this.max = max;
        this.disc = disc;
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
}

class RandomGaussianGenerator extends Random{
    constructor(mean=0, std=1){
        super();
        this.mean = mean;
        this.std = std;
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
}

class RandomPoissonGenerator extends Random{

    constructor(lambda=1){
        super();
        this.lambda = lambda;
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
}

class RandomBernoulliGenerator extends Random{
    constructor(p=0.5){
        super();
        this.p = p;
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
}

class RandomCauchyGenerator extends Random{
    constructor(loc=0, scale=1){
        super();
        this.loc = loc;
        this.scale = scale;
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
}

class RandomCategorical extends Random {
    constructor(array = ["Banana", "Apple", "Orange"]) {
        super();
        this.array = array;
    }

    //TODO: verificar porque não chama o super.generate()
    generate() {
        return this.lastGenerated = this.array[Math.floor(Math.random() * this.array.length)];
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

    getReturnedType(){
        return "Categorical";
    }
}

class RandomCategoricalQtt extends Random {
    constructor(array=["Banana", "Apple", "Orange"], quantity=[3,5]) {
        super();
        this.array = array;
        this.quantity = quantity;
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

    getReturnedType(){
        return "Categorical";
    }
}

class RandomWeightedCategorical extends Random {
    constructor(array=["Banana", "Apple", "Orange"],weights=[0.3, 0.2, 0.5]) {
        super();
        this.array = array;
        this.weights = weights;
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
    constructor(initTime="00:00:00", timeMask="HH:mm:ss", interval=5, intervalUnit="minutes",lambda=2){
        super();
        this.initTime = initTime;
        this.interval = interval;
        this.intervalUnit = intervalUnit;
        this.timeMask = timeMask;
        this.lambda = lambda;
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

    reset(){
        this.time = moment(this.initTime, this.timeMask);
        this.timeInterval = moment.duration(this.interval, this.intervalUnit);
    }

    getReturnedType(){
        return "Time";
    }
}

class RandomFileName extends Random{

    constructor(folder=""){
        super("Random File Name");
        this.accessFolder = folder;
        this.files = [];
        this.pathFile = "";
    }

    get accessFolder(){
        return this.folder;
    }

    set accessFolder(folder){
        this.folder = folder
        if(this.folder){
            this.files = this.folder;
        }else{
            this.files = ["None"];
        }
        //TODO: refactor -> jogar para o main
        /*if(this.folder){
            let fs = require('fs');
            this.files = fs.readdirSync(this.folder);
        }else{
            this.files = ["None"]
        }*/
    }

    generate(){
        this.files = this.folder;
        this.pathFile = randgen.rlist(this.files); //pega somente um caminho de forma aleatória
        let splitPath = this.pathFile.split("/");
        this.fileName = splitPath[splitPath.length - 1];
        return this.lastGenerated = super.generate(this.fileName);
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Folder",
                variableName: "accessFolder",
                name: "Folder",
                type: "folder"
            }
        );
        return params;
    }

    getModel(){
        let model = super.getModel();
        return model;
    }

    copy(){
        let newGen = new RandomFileName(this.folder);
        super.copy(newGen);
        return newGen;
    }
}






class Accessory extends Generator{
}

class MCAR extends Accessory{

    constructor(value="Miss", probability=0.1){
        super();
        this.value = value;
        this.probability = probability;
    }

    generate(){
        if(Math.random() > this.probability) return this.lastGenerated = super.generate(0);
        
        return this.lastGenerated = this.value;
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

    getReturnedType(){
        if(!this.generator) return "Mixed";
        const genColType = this.generator.getReturnedType();
        if(genColType === "Categorical" || genColType === "Time") this.operator = Generator.Operators.none;
        return genColType
    }
}

class MNAR extends Accessory{

    constructor(value="Miss", probability=1, firstPattern="", secondPattern="", mask="HH:mm:ss"){
        super();
        this.operator = Generator.Operators.none;
        this.value = value;
        this.probability = probability;
        this.columnType = this.getReturnedType();
        this.firstPattern = firstPattern;
        this.secondPattern = secondPattern;
        this.mask = mask;
        //TODO: Retirar esse explain do objeto e passar para a class
        this.explain = "This generator works assuming 3 types of data: Numeric, Categorical and Time. For Numeric, all number between first and second pattern will be missing. For categorical, all categories listed in first pattern will be missing. For Time, all time inside the interval between first and second pattern will be missing."
    }

    generate(value = super.generate(false)){
        
        if(this.columnType === "Categorical") {
            try{
                if(Math.random()<this.probability)
                    if(this.firstPattern.replace(" ", "").split(",").includes(value.replace(" ", "")))
                        return this.lastGenerated = this.value;
                return this.lastGenerated = value
            } catch(e) {
                console.error(e)
                return this.lastGenerated = value
            }
        }
        if(this.columnType === "Numeric"){
            try {
                if(Math.random()<this.probability)
                    if(value > this.firstPattern && value < this.secondPattern) 
                        return this.lastGenerated = this.value
                return this.lastGenerated = value
            } catch(e) {
                console.error(e)
                return this.lastGenerated = value
            }
            
        }
        if(this.columnType === "Time") {
            try {

                const
                { mask } = this,
                currentTime = moment(value, mask),
                beforeTime = moment(this.firstPattern, mask),
                afterTime = moment(this.secondPattern, mask);
                if(Math.random()<this.probability)
                    if(currentTime.isBetween(beforeTime, afterTime)) 
                        return this.lastGenerated = this.value
                return this.lastGenerated = value
            } catch(e) {
                console.error(e)
                return this.lastGenerated = value
            }
            
        }
        
    }

    set accessColumnType(value) {
        this.columnType = value
        this.firstPattern = ""
        this.secondPattern = ""
        this.inputGenerator = undefined
    }
    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Value",
                variableName: "value",
                name: "The Missing Value",
                type: "auto"
            },
            {
                shortName: "Probability",
                variableName: "probability",
                name: "The Missing Rate",
                type: "number"
            }
        );
        if(this.columnType !== "Time") params.push(
            {
                shortName: "First Pattern",
                variableName: "firstPattern",
                name: "The First Pattern",
                type: "auto"
            }
        );
        if(this.columnType !== "Categorical" && this.columnType !== "Time") params.push(
            {
                shortName: "Second Pattern",
                variableName: "secondPattern",
                name: "The Second Pattern",
                type: "auto"
            }
        );
        if(this.columnType === "Time") params.push(
            {
                shortName: "First Pattern",
                variableName: "firstPattern",
                name: "The First Pattern",
                type: "string"
            },
            {
                shortName: "Second Pattern",
                variableName: "secondPattern",
                name: "The Second Pattern",
                type: "string"
            },
            {
                shortName: "Mask",
                variableName: "mask",
                name: "The time mask",
                type: "string"
            }
        );

        return params;
    }

    getReturnedType() {
        if(!this.generator) return super.getReturnedType()

        const genColType = this.generator.getReturnedType()
        if(genColType === "Categorical" || genColType === "Time") 
            this.operator = Generator.Operators.none

        if(genColType !== this.columnType)
            this.accessColumnType = genColType
        return genColType
        
    }

    getExplaining() {
        return this.explain
    }
}

class RandomConstantNoiseGenerator extends Accessory{
    constructor(probability=0.3, value=1){
        super();
        this.probability = probability;
        this.value = value;
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
}

class RandomFixedNoiseGenerator extends Accessory{
    constructor(quantity=3, intensity=1){
        super();
        this.quantity = quantity;
        this.intensity = intensity;
        this.count = 0;
        this.pos = [];
    }

    generate(){
        if (this.pos.indexOf(this.count) > -1){
            this.lastGenerated = super.generate(0) + (Math.random()+0.001)*this.intensity;
            this.count++;
            return this.lastGenerated;
        }else{
            this.count++;
            return super.generate(0);
        }
    }

    reset(){
        this.count = 0;
        this.pos = [];
        while(this.pos.length < this.quantity){
            let r = Math.floor(Math.random() * this.dataGen.n_sample_lines);
            if(this.pos.indexOf(r) === -1) this.pos.push(r);
        }
        super.reset();
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Quant",
                variableName: "quantity",
                name: "Fixed Quantity of Noise",
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
}

class RandomNoiseGenerator extends Accessory{
    constructor(probability=0.3, intensity=1, generator2=new defaultGenerator()){
        super();
        this.generator2 = generator2;
        this.genType = this.generator2.constructor.displayName;
        this.probability = probability;
        this.intensity = intensity;
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
        return model;
    }

    copy(){
        let newGen = super.copy();
        if (this.generator2){
            newGen.generator2 = this.generator2.copy();// Talvez dê problema no futuro
        }
        return newGen;
    }
}



class RangeFilter extends Accessory {
    constructor(begin=0, end=10) {
        super();
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
}

class LinearScale extends Accessory {
    constructor(minDomain=0,maxDomain=100, minRange=0, maxRange=1) {
        super();
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
}

class Normalization extends Accessory{
    constructor(mean = 0, std = 1){
        super();
        this.mean = mean;
        this.std = std;
    }

    generate() {
        return this.lastGenerated = (super.generate(0)-this.mean)/this.std;
    }

    getGenParams() {
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Mean",
                variableName: "mean",
                name: "Mean of Normalization",
                type: "number"
            },
            {
                shortName: "Std",
                variableName: "std",
                name: "Standard Deviation",
                type: "number"
            }
        );
        return params;
    }
}

class MinMax extends Accessory {
    constructor(min=0, max=100) {
        super();
        this.min = min;
        this.max = max;
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
}

class NumberFormat extends Accessory {
    constructor(disc=false, decPlaces=2) {
        super();
        this.disc = disc;
        this.decPlaces = decPlaces;
    }

    generate() {
        let value = super.generate(0)
        if(this.disc) {
            value = Math.round(value)
        } else if(this.decPlaces) {
            value = Number(value.toFixed(this.decPlaces))
        }
        return this.lastGenerated = value;
    }

    getGenParams(){
        let params = super.getGenParams();
        params.push(
            {
                shortName: "Disc",
                variableName: "disc",
                name: "Discrete Values",
                type: "boolean"
            },
            {
                shortName: "Decimal Places",
                variableName: "decPlaces",
                name: "Decimal Places",
                type: "number"
            }
        );
        return params;
    }
}

class LowPassFilter extends Accessory {
    constructor(scale=2) {
        super();
        this.scale = scale;
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
}

class NoRepeat extends Accessory {
    constructor() {
        super();
        this.values = [];
    }

    generate() {
        let newValue = super.generate(0);
        if(newValue === undefined || newValue === null) return false
        while(this.values.includes(newValue))
            newValue = super.generate(0);

        this.values.push(newValue);
        return newValue;
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
    constructor(extra_index=1, srcGen){
        super();
        this.extra_index = extra_index;
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
    set accessSrcGen(gen){
        this.srcGen = gen;
    }

    getModel(){
        let model = super.getModel();
        model.srcGen = this.srcGen ? this.srcGen.ID : "";
        return model;
    }
}


class Geometric extends Generator{
}

class CubicBezierGenerator extends Geometric{
    constructor(x0=0, y0=0, x1=4, y1=2, x2=0, y2=2, x3=1, y3=1.8, proportional=true){
        super();
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.x3 = x3;
        this.y3 = y3;
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
    constructor(x0=0, y0=0, x1=5, y1=5){
        super();
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;

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

    updateLineParams(){
        this.m = (this.y1-this.y0)/(this.x1-this.x0);
        this.b = this.y0-this.m*this.x0;
        this.arclength = Math.sqrt(Math.pow(this.x0-this.x1,2) + Math.pow(this.y0-this.y1,2));
    }
}

class Path2DStrokeGenerator extends Geometric{
    constructor(path="M10,60 C 20,80 40,80 50,60"){
        super();
        this.path = path;
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
    constructor(path="M10,60 C 20,80 40,80 50,60"){
        super();
        this.path = path;

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
                    lastPoint[0] = lastp[0][0];
                    lastPoint[1] = lastp[0][1];
                    break;
                case "z":
                    lastp = this.polygons[this.polygons.length-1];
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

//TODO: refatorar para selecionar a coluna do gerador... e não um gerador
//TODO: Continuar refatoração daqui.
class Function extends Generator{

    constructor(inputIndex){
        super();
        this.accessIndex = inputIndex;
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
                variableName: "accessIndex",
                name: "Input Column (Previous one)",
                type: "NumericColumn"
            }
        );
        return params;
    }


    get accessIndex(){
        return this.inputIndex;
    }
    set accessIndex(index){
        this.inputIndex = index;
        if(this.dataGen)
            this.inputGenerator = this.dataGen.columns[index].generator;
    }
}



class LinearFunction extends Function{
    constructor(inputIndex, a=2, b=1){
        super(inputIndex);
        this.a = a;
        this.b = b;
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
}

class QuadraticFunction extends Function{
    constructor(inputIndex, a=1, b=2, c=3){
        super(inputIndex);
        this.a = a;
        this.b = b;
        this.c = c;
    }

    transform(x){
        return this.a*x*x + this.b*x + this.c;
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
}

class PolynomialFunction extends Function{
    constructor(inputIndex, constants=[1,1,1]){
        super(inputIndex);
        this.constants = constants;
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
}

class ExponentialFunction extends Function{
    constructor(inputIndex, a=2, b=1){
        super(inputIndex);
        this.a = a;
        this.b = b;
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
}

class LogarithmFunction extends Function{
    constructor(inputIndex, base=Math.E){
        super(inputIndex);
        this.base = base;
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
}

class SinusoidalFunction extends Function{
    constructor(inputIndex, a=1, b=1, c=0){
        super(inputIndex);
        this.a = a;
        this.b = b;
        this.c = c;
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
}

class SwitchCaseFunction extends Function{
    constructor(inputIndex, listOfGenerators={}){
        super(inputIndex);
        this.listOfGenerators = listOfGenerators;
        this.inputArray = [];
    }

    reset(){
        //Sempre que ocorre um reset, o switchCaseFunction avalia a lista de input para verificar se essa lista possui valores novos.
        //Se possui valores a mais, são incluidos RandomUniformGenerators, caso possua um input a menos esse é removido.
        super.reset();
        if (!this.inputGenerator || !this.inputArray)
            return;

        // let auxgen = new RandomUniformGenerator();
        // this.generator = auxgen;
        // auxgen.parent = this;

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
                let gen = new defaultGenerator();
                // auxgen.changeGenerator(gen);
                gen.parent = this;
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
        //this.generator = this.listOfGenerators[x];
        return this.listOfGenerators[x].generate();
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
            //if(this.listOfGenerators.hasOwnProperty(genName)) continue //Faz sentido essa linha?
            if(outType && outType !== this.listOfGenerators[genName].getReturnedType()) return "Mixed";
            outType = this.listOfGenerators[genName].getReturnedType(); //Get last generator type
        }

        return outType ? outType :"Numeric";
    }

    copy(){
        let newList = {};
        //Copia a lista de Geradores
        for(let prop in this.listOfGenerators)
            if(this.listOfGenerators.hasOwnProperty(prop))
                newList[prop] = this.listOfGenerators[prop].copy();

        let newGen = super.copy();
        newGen.listOfGenerators = newList;

        for(let prop in newList)
            if(newList.hasOwnProperty(prop))
                newList[prop].parent = newGen;


        return newGen;
    }

    unlinkChild(child){
        for(let cat in this.listOfGenerators) {
            if (this.listOfGenerators.hasOwnProperty(cat)) {
                if (this.listOfGenerators[cat] === child) {
                    this.listOfGenerators[cat] = child.generator || new defaultGenerator();
                    this.listOfGenerators[cat].parent = this;
                    break;
                }
            }
        }
    }

}



class CategoricalFunction extends SwitchCaseFunction{

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
    constructor(inputIndex, listOfGenerators, intervals=[0]){
        super(inputIndex, listOfGenerators);
        this.intervals = intervals;
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
                // this.generator = this.listOfGenerators["<= "+interval];
                return this.listOfGenerators["<= "+interval].generate();
            }
        }
        if(this.intervals.length > 0){
            return this.listOfGenerators["> "+this.intervals[this.intervals.length-1]].generate();
            // this.generator = this.listOfGenerators["> "+this.intervals[this.intervals.length-1]];
        }
        return 0;
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
}

class TimeLapsFunction extends SwitchCaseFunction{
    constructor(inputIndex, listOfGenerators, laps=[]){
        super(inputIndex, listOfGenerators);
        this.accessLaps = laps;
    }

    transform(x){
        let inputTime = moment(x, this.inputGenerator.timeMask);
        for(let timeLap of this.timeLaps){
            if(inputTime.isSameOrBefore(timeLap)){
                // this.generator = this.listOfGenerators["<= "+timeLap.format(this.inputGenerator.timeMask)];
                return this.listOfGenerators["<= "+timeLap.format(this.inputGenerator.timeMask)].generate();
            }
        }
        if(this.timeLaps.length > 0)
            return this.listOfGenerators["> "+this.timeLaps[this.timeLaps.length-1].format(this.inputGenerator.timeMask)].generate();
            // this.generator = this.listOfGenerators["> "+this.timeLaps[this.timeLaps.length-1].format(this.inputGenerator.timeMask)];
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
}


class Sequence extends Generator{
    constructor(begin=0, step=1){
        super();
        this.begin = begin;
        this.step = step;
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
}

class ConstantValue extends Sequence{

    constructor(value=1){
        super();
        this.value = value;
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

    getEstimatedRange(){
        return [this.value];
    }
}

class CounterGenerator extends Sequence{

    generate(){
        let value = this.count;
        this.count+=this.step;
        return super.generate(value);
    }
}


class SinusoidalSequence extends Sequence{

    constructor(begin=0, step=Math.PI/16, a=1, b=1, c=0){
        super(begin, step);
        this.a = a;
        this.b = b;
        this.c = c;
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
}

class CustomSequence extends Sequence{

    constructor(begin, step, sent=a){
        super(begin, step);
        this.sentence = sent;
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
}

class FixedTimeGenerator extends Sequence{
    constructor(initTime="00:00:00", step="00:00:10", timeMask="HH:mm:ss"){
        super();
        this.initTime = initTime;
        this.strStep = step;
        this.timeMask = timeMask;
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
    constructor(data=[], dataType="Auto", genType="Standart") {
        super();
        this.data = data;
        this.dataType = dataType;
        this.genType = genType;
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

//Experimental
// class NeuralNetwork extends Generator{
//     constructor(name){
//         super(name);
//     }
// }

// class NeuralNetworkGenerator extends NeuralNetwork {

//     constructor(data = [5]) {
//         super("Neural Network Generator");
//         this.data = data;
//         this.fileName = ""
//         this.count = 0;
//         this.tf = require('@tensorflow/tfjs');
//     }

//     get accessFileName (){
//         return this.fileName;
//     }

//     set accessFileName (fileName){
//         this.fileName = fileName;
//         this.tf.loadLayersModel(`file://${fileName}`).then((res)=>{
//             this.model = res;
//         });
//     }

//     generate() {
//         try{
//             let dados = [[1, 2, 3, 4, 5], [6, 7, 8, 9, 10], [11, 12, 13, 14, 15], [16, 17, 18, 19, 20], [21, 22, 23, 24, 25], [26, 27, 28, 29, 30], [31, 32, 33, 34, 35], [36, 37, 38, 39, 40]];
//             this.lastGenerated = this.model.predict(this.tf.tensor2d(dados))[this.count];
//             this.count++;
//         }catch(e){
//             return this.lastGenerated = 0;
//         }
//         return this.lastGenerated;
//     }

//     getGenParams() {
//         let params = super.getGenParams();
//         params.push(
//             {
//                 shortName: "File",
//                 variableName: "accessFileName",
//                 name: "TF Model File",
//                 type: "file"
//             }
//         );
//         return params;
//     }

//     getModel(){
//         let model = super.getModel();
//         return model;
//     }

//     copy(){
//         let newGen = new NeuralNetworkGenerator(this.data);
//         if (this.generator){
//             newGen.addGenerator(this.generator.copy(), this.order);
//         }
//         return newGen;
//     }

// }

// class ScriptReader extends Generator{
//     constructor(name){
//         super(name);
//     }
// }

// class PythonScriptReader extends ScriptReader {

//     constructor(extra_index = 1){
//         super("Python Script Reader");
//         this.scriptPath = "";
//         this.filePath = "";
//         this.accessFileNameInputGen = "";
//         this.fileName = "";
//         this.exec = "";
//         this.extra_index = extra_index;
//     }

//         get accessScriptPath (){
//         return this.scriptPath;
//     }

//     set accessScriptPath (scriptPath){
//         if(scriptPath){
//             this.scriptPath = scriptPath;
//         }else{
//             this.scriptPath = ["None"];
//         }     
//     }

//     get accessFileNameInputGen (){
//         return this.fileNameInputGen;
//     }

//     set accessFileNameInputGen (fileNameInputGen){
//         //Se string ou se gen obj
//         // Guarda o caminho completo em this.imgFilePath
//         this.fileNameInputGen = fileNameInputGen;
//         this.fileName = this.fileNameInputGen.fileName;
//         this.filePath = this.fileNameInputGen.files;
//     }

//     generate() {
//         return this.lastGenerated = super.generate(
//             this.fileNameInputGen ? this.fileNameInputGen.lastGenerated :
//             this.fileName);
//     }

//     getGenParams() {
//         let params = super.getGenParams();
//         params.push(
//             {
//                 shortName: "Random File",
//                 variableName: "accessFileNameInputGen",
//                 name: "File Name Gen",
//                 type: "Generator"
//             },
//             {
//                 shortName: "Script",
//                 variableName: "accessScriptPath",
//                 name: "Script File",
//                 type: "file"
//             },
//             {
//                 shortName: "i",
//                 variableName: "extra_index",
//                 name: "Index of Extra Value",
//                 type: "number"
//             }
//         );
//         return params;
//     }

//     getModel(){
//         let model = super.getModel();
//         model.extra_index = this.extra_index;
//         model.imgPathInputGen = this.imgPathInputGen ? this.imgPathInputGen.ID : "";
//         return model;
//     }

//     getReturnedType(){
//         return "Categorical";
//     }

//     copy(){
//         let newGen = new PythonScriptReader(this.array);
//         if (this.generator){
//             newGen.addGenerator(this.generator.copy(), this.order);
//         }
//         return newGen;
//     }
    
//     afterGenerate(arrayFileName){
//         if(this.exec != ""){
//             this.exec.kill('SIGKILL');
//         }           

//         const spawn = require("child_process").spawn;
//         (async () => {
//             try {
//                 // this.scriptPath: caminho do script python
//                 // this.filePath: array com os caminhos completos dos arquivos
//                 // arrayFileName[0]: Nome do primeiro arquivo com a extensão (Ex.: casaache.png)
//                 // arrayFileName: Array com os nomes para pegar a quantidade de arquivos a serem gerados
                
//                 // Para gerar imagens de múltiplas imagens de entrada
//                 this.exec = spawn('python',[this.scriptPath, this.filePath[0], arrayFileName], {
//                     killSignal: 'SIGKILL',
//                   });
               
//                 // Para gerar imagens de múltiplas imagens de entrada
//                 /*this.exec = spawn('python',[this.scriptPath, this.filePath[0], arrayFileName[0], arrayFileName], {
//                     killSignal: 'SIGKILL',
//                 });*/

//                 this.exec.stdin.end();

//                 let error = '';
//                 for await (const chunk of this.exec.stderr) {
//                     error += chunk;
//                 }
//                 if (error) {
//                     console.error('error', error);
//                     return;
//                 }

//                 let data = '';
//                 for await (const chunk of this.exec.stdout) {
//                     data += chunk; 
//                 }
//                 if (data) { 
//                     this.array = JSON.parse(data);
//                 }
//             } catch (e) {
//                 console.error('execute error', e);
//             }
//         })();                   
//         super.afterGenerate();
//     }
// }

Generator.Operators = {
    "sum": (a,b) => { return a+b; },
    "multiply": (a,b) => { return a*b; },
    "modulus": (a,b) => { return a%b; },
    "divide": (a,b) => { return a/b; },
    "subtract": (a,b) => { return a-b; },
    "none": (a,b) => { return b; }
};

Generator.Operators.sum.name = "sum";
Generator.Operators.multiply.name = "multiply";
Generator.Operators.modulus.name = "modulus";
Generator.Operators.divide.name = "divide";
Generator.Operators.subtract.name = "subtract";
Generator.Operators.none.name = "none";



///--------------------------  Gerenciador de Colunas e Geração da base total. ----------------------------------------


let defaultGenerator = RandomUniformGenerator;
let defaultOperator = Generator.Operators.sum;

class Column{
    constructor(name = "Col", generator = new defaultGenerator()){
        this.name = name;
        this.generator = generator;
        this.type = this.generator.getReturnedType();
        this.ID = "COL_"+DataGen.Utils.getID();
        this.generator.parent = this;
        this.display = true; //Variável utilizada para filtrar a dimensão de dados.
    }
}

class DataGen {

    constructor (name = "Model", column_name="Dimension 1") {
        //adicionar a version => const { version } = require('./package.json');
        this.name = name;
        this.n_lines = 20; // Quantidade de linhas na geração
        this.step_lines = 10000; // TODO: Revisar o propósito disso...
        this.n_sample_lines = 20;
        this.save_as = "csv";
        this.header = true;
        this.header_type = true;
        // const column = new Column(column_name);
        // this.columns = [column];
        this.columns = [];
        this.addColumn(column_name);
        this.iterator = {hasIt:false};
        this.ID = "MODEL_"+DataGen.Utils.getID();
        this.columnsCounter = 1; //If delete a not last column, the new colum will the same name as the last but one column and this make the preview have a bug.
        this.filePath = undefined;
        this.datagenChange = false;
        this.seed = false;
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
            seed: this.seed || "",
            iterator: this.iterator
        }
    }

    set configs(obj){
        if(obj.n_lines) this.n_lines = obj.n_lines;
        if(obj.n_sample_lines) this.n_sample_lines = obj.n_sample_lines;
        if(obj.save_as) this.save_as = obj.save_as;
        if(typeof obj.header === "boolean") this.header = obj.header;
        if(typeof obj.header_type === "boolean") this.header_type = obj.header_type;
        if(typeof obj.seed === "string" && obj.seed !== "") this.seed = obj.seed;
        else this.seed = undefined;
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

    addColumn(name, generator = new defaultGenerator()){
        generator.dataGen = this;
        let column = new Column(name, generator);
        this.columns.push(column);
    }

    changeGeneratorToIndex(index, gen, order){
        gen.dataGen = this;
        if (order === 0)
            this.columns[index].generator = gen;
        else
            this.columns[index].generator.changeGenerator(gen,order);
    }

    addGeneratorToIndex(index, gen){
        gen.dataGen = this;
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
        //Troca entre gerador aleatório com ou sem semente.
        if(this.seed) seedrandom(this.seed, { global: true });
        else Math.random = originalRandom;

        let data = [];
        const numberLines = 
            Number(quantity) ?
                quantity > this.step_lines ? 
                    this.step_lines 
                : quantity
            : this.n_lines;
            
        for (let i = 0; i < numberLines; i++){
            data.push( this.save_as === "json" && !this.header ? [] : {});
            for (let col of this.columns){
                if(col.display) {
                    if(this.save_as === "json" && !this.header){
                        data[i].push(col.generator.generate());
                    } else {
                        data[i][col.name] = col.generator.generate();
                    }
                }
            }
        }
        this.resetAll();
        for(let col of this.columns){
            col.generator.afterGenerate(data.map(v => v[col.name]))
        }
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
            n_sample_lines: this.n_sample_lines,
            columnsCounter: this.columnsCounter,
            save_as: this.save_as,
            header: this.header,
            header_type: this.header_type,
            seed: this.seed || ""
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
        this.step_lines = model.step_lines || this.step_lines;
        this.n_sample_lines = model.n_sample_lines || this.n_sample_lines;
        this.columnsCounter = model.columnsCounter;
        this.save_as = model.save_as || this.save_as;
        this.header = model.header || this.header;
        this.header_type = model.header_type || this.header_type;
        if(typeof model.seed === "string" && model.seed !== "")
            this.seed = model.seed;

        if(resetColumns)
            this.columns = [];

        for(let i=0; i < model.generator.length; i++){
            let generator;
            for(let j=0; j<model.generator[i].generator.length; j++){
                let selectedGenerator = DataGen.listOfGens[model.generator[i].generator[j].name];
                if (generator){
                    let newgen = new selectedGenerator();
                    newgen.dataGen = this;
                    generator.addGenerator(newgen);
                    DataGen.Utils.copyAttrs(model.generator[i].generator[j], newgen, this);
                }else {
                    generator = new selectedGenerator();
                    generator.dataGen = this;
                    DataGen.Utils.copyAttrs(model.generator[i].generator[j], generator, this);
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
    }

    forward() {
        if(this.memento.index !== this.memento.snapshot.length-1) {
            this.importModel(this.memento.snapshot[++this.memento.index], true);
        }
    }

    restore() {
        if(this.memento.index !== 0) {
            this.importModel(this.memento.snapshot[--this.memento.index], true);
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


//TODO: Criar propriedade estática name e description para cada gerador.
DataGen.listOfGens = {
    'Constant Value': ConstantValue,
    //Legacy form below
    'Missing Value': MCAR,
    'MCAR': MCAR,
    // 'MAR': MAR,
    'MNAR': MNAR,
    'Counter Generator': CounterGenerator,
    'Fixed Time Generator': FixedTimeGenerator,
    // 'Neural Network Generator': NeuralNetworkGenerator, // Experimental
    // 'Python Script Reader': PythonScriptReader, // Experimental
    'Poisson Time Generator': PoissonTimeGenerator,
    'Uniform Generator': RandomUniformGenerator,
    'Gaussian Generator': RandomGaussianGenerator,
    'Poisson Generator': RandomPoissonGenerator,
    'Bernoulli Generator': RandomBernoulliGenerator,
    'Cauchy Generator': RandomCauchyGenerator,
    'Noise Generator': RandomNoiseGenerator,
    'Fixed Quantity Noise': RandomFixedNoiseGenerator,
    'Constant Noise Generator': RandomConstantNoiseGenerator,
    'Random File Name': RandomFileName,
    'Range Filter': RangeFilter,
    'Linear Scale': LinearScale,
    'Normalization':  Normalization,
    'No Repeat': NoRepeat,
    'MinMax': MinMax,
    'NumberFormat': NumberFormat,
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

//TODO: Verificar se essa propriedade não pode ser substituida por uma propriedade estática em cada Gerador.
DataGen.listOfGensHelp = {
    'Constant Value': "Generate a sequence with only one constant number.",
    'MCAR': "[Use at left] Introduce values Missing Completely At Random.",
    'MAR': "[Use at left] Introduce values Missing At Random.",
    'MNAR': "[Use at left] Introduce values Missing Not At Random.",
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
    'Fixed Quantity Noise': "Generate a fixed quantity of Noise in data",
    'Range Filter': RangeFilter,
    'Linear Scale': LinearScale,
    'No Repeat': "Generate distinct values.",
    'MinMax': MinMax,
    "Number Format": "Format the number from generators",
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

//TODO: Verificar se isso é uma boa mesmo... Acho melhor deixar o usuário livre para essa decisão.
DataGen.listOfGensComplete = {
    'Real Data Wrapper' : RealDataWrapper
};
for(let attr in DataGen.listOfGens){
    if(DataGen.listOfGens.hasOwnProperty(attr)){
        DataGen.listOfGensComplete[attr] = DataGen.listOfGens[attr];
        DataGen.listOfGensComplete[attr].displayName = attr;
    }
}


DataGen.superTypes = {
    Generator,
    Function,
    SwitchCaseFunction,
    Sequence,
    Random,
    Accessory,
    Geometric,
    Column//,
    // NeuralNetwork, // Experimental
    // ScriptReader, // Experimental
};

DataGen.listOfSuperTypesMenu = [
    "Sequence",
    "Random",
    "Function",
    "Accessory",
    "Geometric"//,
    // "NeuralNetwork", // Experimental
   // "ScriptReader" // Experimental
];

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
    },

    getID: ()=>{
        return (Math.random()*Date.now()/Math.random()).toString(36);
    },

    copyAttrs: (source, target, context)=>{
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
                                DataGen.Utils.copyAttrs(genObj, gen1, context);
    
                            }
                        }
                    }
                }else{
                    target[attr] = source[attr];
                }
            }
        }
    },

    funcArgs(func) {  
        let arr = (func + '')
          .replace(/[/][/].*$/mg,'') // strip single-line comments
          .replace(/\s+/g, '') // strip white space
          .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments 
          .replace("[objectObject]",'')
          .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
          .replace(/=\[([^\]]*)?\]/g, '')
          .replace(/=\{([^\}]*)?\}/g,'')
          .replace(/=[^,]+/g, '') // strip any ES6 defaults  
        .split(',')
        .filter(Boolean)
        .filter(param => /^[a-zA-Z_$][a-zA-Z_$0-9]*$/g.test(param) );
           // split & filter [""]

        arr = arr

        let aux = func.__proto__;
        if(aux)
            return [...new Set(arr.concat(this.funcArgs(aux)))];
        return arr;
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