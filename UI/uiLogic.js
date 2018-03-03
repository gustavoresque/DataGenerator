let fs = require('fs');
const electron = require('electron').remote;
const dialog = electron.dialog;

let datagen = [new DataGen()];
let currentDataGen = 0;
let activeGenerator;
let ipc = require('electron').ipcRenderer;

const Json2csvParser = require('json2csv').Parser;

ipc.on('change-datagen', function(event, arg){
    datagen[currentDataGen].configs = arg;
    console.log(datagen[currentDataGen].configs);
});

$("html").ready(function(){
    for(let i = 0; i < datagen.length; i++){
        let modelButton = $("<span/>").addClass("nav-group-item").text(datagen[i].name + " " + (i+1)).append($("<span/>").addClass("icon").addClass("icon-doc-text-inv"));
        if (currentDataGen === i)
            modelButton.addClass("active");
        modelButton.on("click", function () {
            if (currentDataGen !== i){
                currentDataGen = i;
                $("#modelsPane").children().removeClass('active');
                $(this).addClass("active");
                $('#selectGeneratorType').empty().attr("disabled", true);
                $('#generatorPropertiesForm').empty();
                showGenerators();
            }
        });
        $("#modelsPane").append(modelButton);
    }

    $("#tableCollumn").on("dblclick", "td.columnName", function(){
        let title = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", title).blur(function(){
            let cor = $(this).val();
            $(this).parent().parent().get(0).__node__.name = cor;
            $(this).parent().text(cor);
        }));
    });

    $("#tableCollumn").on("dblclick", "td.columnType", function(){
        let typeData = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", typeData).blur(function(){
            let cor = $(this).val();
            $(this).parent().parent().get(0).__node__.type = cor;
            $(this).parent().text(cor);
        }));
    });

    $("#generatorPropertiesForm").on("change blur", "input,select", function(){
        let $input = $(this);
        if($input.attr("data-type") === "number")
            this.__node__[$input.attr("data-variable")] = parseFloat($input.val());

        else if($input.attr("data-type") === "string")
            this.__node__[$input.attr("data-variable")] = $input.val();

        else if($input.attr("data-type") === "auto")
            this.__node__[$input.attr("data-variable")] = isNaN(parseFloat($input.val())) ? $input.val() : parseFloat($input.val());

        else if($input.attr("data-type") === "array")
            this.__node__[$input.attr("data-variable")] = $input.val().split(",");

        else if($input.attr("data-type") === "boolean")
            this.__node__[$input.attr("data-variable")] = $input.get(0).checked;

        else if($input.attr("data-type") === "Generator")
            this.__node__[$input.attr("data-variable")] = new (DataGenerator.prototype.listOfGens[$input.val()])();

        else if($input.attr("data-type").indexOf("Column") >= 0) {
            this.__node__[$input.attr("data-variable")] = datagen[currentDataGen].columns[parseInt($input.val())].generator;
            this.__node__.inputGenIndex = parseInt($input.val());
            this.__node__.reset();
        }else if($input.attr("data-type") === "numarray"){
            let arr = $input.val().split(",");
            for(let i=0; i<arr.length; i++)
                arr[i] = +arr[i];
            this.__node__[$input.attr("data-variable")] = arr;
        }
        datagen[currentDataGen].resetAll();
        showGenerators();
    });

    $("#tableCollumn").on("click", "div.md-chip", configGenProps);

    $("#selectGeneratorType").on("change blur", function(){
        let nameNewGenerator = $(this).val();
        let newGen = new (datagen[currentDataGen].listOfGens[nameNewGenerator])();
        //substitui o gerador na estrutura.

        this.__node__.changeGenerator(newGen);
        activeGenerator = newGen;

        let $active_chip = showGenerators();
        configGenProps.apply($active_chip.get(0));
        datagen[currentDataGen].resetAll();
    });

    $("#rowsQtInput").blur(function(){
        $(".tooltiptext").css("visibility", "hidden").css("opacity", 0);
    });

    $("#btnConfigGeneration").click(function(){
        // if($(".tooltiptext").css("visibility") === "hidden")
        //     $(".tooltiptext").css("visibility", "visible").css("opacity", 1);
        // else
        //     $(".tooltiptext").css("visibility", "hidden").css("opacity", 0);

        // console.log(window.location);
        // let windowObjectReference = window.open("http://localhost:63342/DataGenerator/pages/configDatagen.html", "Configure Generation");
        // windowObjectReference.minhavar = "ALo";
        // windowObjectReference.document.write("<p>This is 'myWindow'</p>");

        ipc.send('open-config-datagen-window', datagen[currentDataGen].configs);
    });

    $("#tableCollumn").on("click", "span.btnRemoveGen", function(){
        if ($(this).parent().find("div.md-chip").length > 1){
            let l = $(this).parent().find("div.md-chip").length-2;
            $(this).parent().find("div.md-chip").get(l).__node__.removeLastGenerator();
            showGenerators();
        }
    });

    $("#tableCollumn").on("click", "span.btnAddGen", function(){
        let l = $(this).parent().find("div.md-chip").length-1;
        $(this).parent().find("div.md-chip").get(l).__node__.addGenerator(new CounterGenerator());

        showGenerators();
    });

    $("#tableCollumn").on("click", "td.btnRemoveColumn", function(){
        datagen[currentDataGen].removeCollumn(parseInt($(this).parent().find(".tdIndex").text()) - 1);
        showGenerators();
    });


    $("#checkboxAllColumns").on("change", function(){
        let haschecked = false;
        let $cheboxes = $(".checkboxSelectColumn");
        $cheboxes.each(function(){
            if($(this).is(":checked"))
                return haschecked = true;
        });
        haschecked = !haschecked;
        $(this).get(0).checked = haschecked;
        $cheboxes.each(function(){
            $(this).get(0).checked = haschecked;
        });
        $cheboxes.trigger("change");

    });

    $("#tableCollumn").on("change", "input.checkboxSelectColumn", function(){
        console.log(this);
    });

});

function generateDatas(){
    // document.getElementById("theadResult").innerHTML = "<tr>";
    // let dataToExport = [];
    // let t = "";
    //
    // datagen[currentDataGen].columns.forEach(function(item){
    //     t += "<th>" + item.name + "</th>";
    // });
    // document.getElementById("theadResult").innerHTML += t + "</tr>";
    //
    // document.getElementById("tbodyResult").innerHTML="";
    // for (let i = 0; i < data.length; i++) {
    //     let tr = document.createElement('TR');
    //     for (let j = 0; j < data[i].length; j++) {
    //         let td = document.createElement('TD');
    //         td.appendChild(document.createTextNode(data[i][j]));
    //         tr.appendChild(td)
    //     }
    //     document.getElementById("tbodyResult").appendChild(tr);
    // }
    //

    let data = datagen[currentDataGen].generate();
    let datastr;
    let save_as = datagen[currentDataGen].save_as;
    let filt = {};

    if(save_as === "json"){
        filt.name = "json";
        filt.extensions = ['json'];
        datastr = JSON.stringify(data);
    }else if(save_as === "csv" || save_as === "tsv"){
        let json2csvParser = new Json2csvParser({ fields: datagen[currentDataGen].getColumnsNames() });
        console.log(json2csvParser);
        if(save_as === "csv"){
            filt.name = "csv";
            filt.extensions = ['csv'];
        }else{
            json2csvParser.opts.delimiter = "\t";
            filt.name = "tsv";
            filt.extensions = ['tsv'];
        }

        json2csvParser.opts.header = datagen[currentDataGen].header;

        datastr = json2csvParser.parse(data);
    }



    dialog.showSaveDialog({title:"Save Data", filters:[filt]}, function(targetPath) {
        if(targetPath){
            // console.log(targetPath);
            // let partsOfStr = targetPath.split('\\');
            // targetPath = "";
            // for (let i = 0; i < partsOfStr.length; i++) {
            //     targetPath += partsOfStr[i] + "\\\\";
            // }
            // console.log(targetPath);
            fs.writeFile(targetPath, datastr, (err) => {
                if (err) throw err;
            });
        }
    });

    // if (datagen[currentDataGen].save_as === 'csv')
    //     exportResultsCSVTSV(data, ";");
    // else if (datagen[currentDataGen].save_as === 'tsv')
    //     exportResultsCSVTSV(data, "\t");
    // else
    //     exportResultsCSVTSV(data, "\t");
}

function addGenerator(){
    datagen[currentDataGen].addCollumn("Column "+(datagen[currentDataGen].columns.length+1), "Numeric", new CounterGenerator());

    showGenerators();
}

/*Desenha na tela principal as colunas e seus respectivos geradores paseados nos dados armazendos no array datagen*/
function showGenerators(){
    let active_gen_chip;
    $("#tbody").empty();
    for(let i = 0; i < datagen[currentDataGen].columns.length; i++){
        let $tr = $("<tr/>");
        datagen[currentDataGen].columns[i].type = datagen[currentDataGen].columns[i].generator.getReturnedType();
        $("#tbody").append($tr
            .append($("<td/>").append($("<input/>").attr("type", "checkbox").addClass("checkboxSelectColumn")))
            .append($("<td/>").text(i+1).addClass("tdIndex"))
            .append($("<td/>").text(datagen[currentDataGen].columns[i].name).addClass("columnName"))
            .append($("<td/>").text(datagen[currentDataGen].columns[i].type).addClass("columnType"))
        );
        let generators = [];
        let $tdGen = $("<td/>").addClass("columnGen");

        datagen[currentDataGen].columns[i].generator.getFullGenerator(generators);
        let counter = 0;

        // FILHOS DO CATEGORICO
        if (datagen[currentDataGen].columns[i].generator.name === "Categorical Function"){
            let $switchGenTable = $("<table/>");
            let $chip = $("<div/>").addClass("md-chip md-chip-hover").text(generators[0].order + "-" + generators[0].name);
            if(generators[0] === activeGenerator)
                active_gen_chip = $chip.addClass("active-md-chip");
            $chip.get(0).__node__ = generators[0];
            $tdGen.append($chip);

            let $switchGenTr;
            let flag = false;
            for (let c in datagen[currentDataGen].columns[i].generator.listOfGenerators){
                $switchGenTr = $("<tr/>");
                if (!flag){
                    $switchGenTr.append($("<td/>").attr("rowspan", Object.keys(datagen[currentDataGen].columns[i].generator.listOfGenerators).length).append($chip));
                    flag = true;
                }
                $switchGenTr.append($("<td/>").text(c));
                let generators2 = [];
                datagen[currentDataGen].columns[i].generator.listOfGenerators[c].getFullGenerator(generators2);
                let counter = 0;
                for(let gen of generators2){
                    let $chip = $("<div/>").addClass("md-chip md-chip-hover").text(gen.order + "-" + gen.name);
                    if(gen === activeGenerator)
                        active_gen_chip = $chip.addClass("active-md-chip");
                    $chip.get(0).__node__ = gen;
                    $switchGenTr.append($("<td/>").append($chip));
                    counter++;
                }

                $switchGenTr.append($("<span/>")
                    .addClass("btnGenerator btnAddGen icon icon-plus-circled")
                ).append($("<span/>")
                    .addClass("btnGenerator btnRemoveGen icon icon-trash")
                );
                $switchGenTable.append($switchGenTr);
            }
            $tdGen.append($switchGenTable);
        }// END FILHOS DO CATEGORICO
        else{
            for(let gen of generators){
                let $chip = $("<div/>").addClass("md-chip md-chip-hover").text(gen.order + "-" + gen.name);
                if(gen === activeGenerator)
                    active_gen_chip = $chip.addClass("active-md-chip");
                $chip.get(0).__node__ = gen;
                $tdGen.append($chip);
                counter++;
            }
            $tdGen.append($("<span/>")
                .addClass("btnGenerator btnAddGen icon icon-plus-circled")
            ).append($("<span/>")
                .addClass("btnGenerator btnRemoveGen icon icon-trash")
            );
        }

        $tr.append($tdGen);

        $tr.get(0).__node__ = datagen[currentDataGen].columns[i];
        $tr.append($("<td/>").addClass("btnGenerator btnRemoveColumn icon icon-trash"));
    }
    return active_gen_chip;
}

/*putGeneratorOptions
* Entradas: select - Lista que será mostrada na hora da seleção
*           selected - Opção que já deverá aparecer selecionada
*           noise - Booleano que indica se os geradores retornados serão geradores de ruídos ou não
* Saída: Lista de geradores que serão mostradas em tags select's
* */
function putGeneratorOptions(select, selected, noise) {
    let list = noise ? DataGenerator.prototype.listOfGensForNoise : DataGenerator.prototype.listOfGens;
    for(let attr in list){
        if(list.hasOwnProperty(attr)) {
            let $option = $("<option/>").attr("value",attr).text(attr);
            if(selected === attr)
                $option.attr("selected", "");
            select.append($option);
        }
    }
}

function configGenProps(){

    //muda a cor do chip para ativo e desativa outro clicado anteriormente.
    $("div.md-chip").removeClass("active-md-chip");
    $(this).addClass("active-md-chip");

    let generator = this.__node__;
    activeGenerator = generator;
    let coluna = $(this).parent().parent().get(0).__node__;
    let params = generator.getGenParams();

    //Ativa o <select> e coloca as opções de Geradores para trocar o tipo do gerador.
    let $selectGenType = $("#selectGeneratorType").removeAttr("disabled").empty();
    putGeneratorOptions($selectGenType, generator.name);
    $selectGenType.get(0).__node__ = generator;

    let $propForms = $("#generatorPropertiesForm");
    $propForms.empty();

    let $table = $("<table/>").attr("id","propertiesTable");
    $propForms.append($table);

    for(let p of params){
        let $tr = $("<tr/>");
        $table.append($tr);
        $tr.append($("<td/>")
            .append($("<label/>")
                .text(p.shortName)
                .addClass("tooltip-label")
                .attr("title", p.name)
                .attr("for", "input_"+p.variableName)));

        if(p.type === "number"){
            let $input = $("<input/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("type","number")
                .attr("value", generator[p.variableName])
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input));

        }else if(p.type === "auto" || p.type === "string") {
            let $input = $("<input/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("type","text")
                .attr("value", generator[p.variableName])
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input));

        }else if(p.type === "array" || p.type === "numarray") {
            let $input = $("<input/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("type", "text")
                .attr("onkeydown", "if (event.keyCode == 13) return false;")
                .attr("value", generator[p.variableName])
                .attr("id", "input_" + p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input));

        }else if (p.type === "boolean") {
            let $input = $("<input/>")
                .attr("type","checkbox")
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input));
            if (generator[p.variableName]){
                $input.attr("checked", "");
            }

        }else if(p.type === "Generator"){// Utiliza os geradores das colunas anteriormente criadas no mesmo model
            let $select = $("<select/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $select.get(0).__node__ = generator;
            putGeneratorOptions($select, generator[p.variableName], true);
            $tr.append($("<td/>").append($select));

        }else if(p.type.indexOf("Column") >= 0){
            let $select = $("<select/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);

            $select.get(0).__node__ = generator;

            //Preenche a lista de seleção para funções
            //Só podem ser utilizadas as colunas anteriores a essa.
            for(let i=0; i<datagen[currentDataGen].columns.length; i++){
                if(datagen[currentDataGen].columns[i] !== coluna){

                    if((p.type.indexOf("Categorical") >= 0 && datagen[currentDataGen].columns[i].type !== "Categorical")
                        || (p.type.indexOf("Numeric") >= 0 && datagen[currentDataGen].columns[i].type !== "Numeric"))
                        continue;
                    let $option = $("<option/>").attr("value", i).text(datagen[currentDataGen].columns[i].name);
                    $option.get(0).__node__ = datagen[currentDataGen].columns[i];

                    if(generator[p.variableName] === datagen[currentDataGen].columns[i].generator){
                        $option.attr("selected", "selected");
                    }
                    $select.append($option);
                }else{
                    break;
                }
            }
            if (!generator[p.variableName]){
                $select.prepend($("<option/>").attr("selected", "selected").text("null"));
            }

            $tr.append($("<td/>").append($select));
        }
    }
    tippy('.tooltip-label');
}

function createNewModel () {
    datagen.push(new DataGen());
    let modelButton = $("<span/>").addClass("nav-group-item").text(datagen[datagen.length-1].name + " " + datagen.length).append($("<span/>").addClass("icon").addClass("icon-doc-text-inv"));
    let pos = (datagen.length-1);
    modelButton.on("click", function () {
        if (currentDataGen !== pos){
            currentDataGen = pos;
            $("#modelsPane").children().removeClass('active');
            $(this).addClass("active");
            $('#selectGeneratorType').empty().attr("disabled", true);
            $('#generatorPropertiesForm').empty();
            showGenerators();
        }
    });
    $("#modelsPane").append(modelButton);
    currentDataGen = pos;
    showGenerators();
}

function createExportModel (path) {
    fs.writeFile(path, datagen[currentDataGen].exportModel(), (err) => {
        if (err) throw err;
    });
}

function createImportModel (data) {
    let dg = new DataGen();
    dg.columns = [];
    dg.importModel(data);
    datagen.push(dg);

    let modelButton = $("<span/>").addClass("nav-group-item").text(datagen[datagen.length-1].name).append($("<span/>").addClass("icon").addClass("icon-doc-text-inv"));
    let pos = (datagen.length-1);
    modelButton.on("click", function () {
        currentDataGen = pos;
        showGenerators();
    });
    $("#modelsPane").append(modelButton);
    currentDataGen = pos;
    showGenerators();
}

function exportResultsCSVTSV(data, separator){
    let str = "";
    if (datagen[currentDataGen].header){
        datagen[currentDataGen].columns.forEach(function(item){
            str += item.name + separator;
        });
        str += "\n";
    }

    if(datagen[currentDataGen].header_type){
        datagen[currentDataGen].columns.forEach(function(item){
            str += item.type + separator;
        });
        str += "\n";
    }

    for (let i = 0; i < data.length; i++){
        for (let j = 0; j < data[i].length; j++){
            str += data[i][j].toString().replace(".", ",") + separator;
        }
        str += "\n";
    }
    let filt = {};
    if (separator === ";"){
        filt.name = "csv";
        filt.extensions = ['csv'];
    }else{
        filt.name = "tsv";
        filt.extensions = ['tsv'];
    }

    dialog.showSaveDialog({title:"Salvar resultados", filters:[filt]}, function(targetPath) {
        if(targetPath){
            var partsOfStr = targetPath.split('\\');
            targetPath = "";
            for (let i = 0; i < partsOfStr.length; i++) {
                targetPath += partsOfStr[i] + "\\\\";
            }
            fs.writeFile(targetPath, str, (err) => {
                if (err) throw err;
            });
        }
    });
}

function exportResultsJSON(data){
    let str = [];
    let obj = [];
    for (let j = 0; j < data[0].length; j++){// Numero de columns
        str.push([]);
        for (let i = 0; i < data.length; i++){// Numero de resultados
            str[j].push(data[i][j]);
        }
    }
    for(let j = 0; j < data[0].length; j++){
        let cols = {};
        if (datagen[currentDataGen].header)
            cols.name = datagen[currentDataGen].columns[j].name;

        if (datagen[currentDataGen].header_type)
            cols.type = datagen[currentDataGen].columns[j].type;

        cols.data = str[j];
        obj.push(cols);
    }

    let myJSON = JSON.stringify(obj);

    dialog.showSaveDialog({title:"Salvar resultados", filters:[{name: 'JSON', extensions:['json']}]}, function(targetPath) {
        if(targetPath){
            var partsOfStr = targetPath.split('\\');
            targetPath = "";
            for (let i = 0; i < partsOfStr.length; i++) {
                targetPath += partsOfStr[i] + "\\\\";
            }
            fs.writeFile(targetPath, myJSON, (err) => {
                if (err) throw err;
            });
        }
    });
}