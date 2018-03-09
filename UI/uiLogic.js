let fs = require('fs');
const electron = require('electron').remote;
const dialog = electron.dialog;

let datagen = [new DataGen()];
let currentDataGen = 0;
let activeGenerator;
let collumnsSelected = [];
let collumnsCopied = [];
let ipc = require('electron').ipcRenderer;

const Json2csvParser = require('json2csv').Parser;

ipc.on('change-datagen', function(event, arg){
    datagen[currentDataGen].configs = arg;
    console.log(datagen[currentDataGen].configs);
});

// $('.previewPanel').resizable({
//     handles: 'n',minHeight: 200,
//     maxHeight: 500
// });

$("html").ready(function(){
    for(let i = 0; i < datagen.length; i++){
        let modelButton = $("<span/>").addClass("nav-group-item").text(datagen[i].name + " " + (i+1)).append($("<span/>").addClass("icon").addClass("icon-doc-text-inv"));
        if (currentDataGen === i)
            modelButton.addClass("active");
        modelButton.mouseup(function(e) {
            switch (event.which) {
                case 1:
                    if (currentDataGen !== i){
                        currentDataGen = i;
                        $("#modelsPane").children().removeClass('active');
                        $(this).addClass("active");
                        $('#selectGeneratorType').empty().attr("disabled", true);
                        $('#generatorPropertiesForm').empty();
                        showGenerators();
                    }
                    break;
                case 2:
                    alert('Middle Mouse button pressed on ' + $(this).text());
                    break;
                case 3:
                    alert('Right Mouse button pressed on ' + $(this).text());
                    break;
                default:
                    alert('You have a strange Mouse!');
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
        let col = $(this).parent().parent().get(0).__node__;
        let i = collumnsSelected.indexOf(col);
        if ($(this).is(':checked')){
            if (i === -1){
                collumnsSelected.push(col);
            }
        }
        else if (i !== -1){
            collumnsSelected.splice(i,1);
        }
    });

    $(document).keydown(function(e) {
        if (e.keyCode == 67 && e.ctrlKey) {// CRTL + C
            collumnsCopied = [];
            for (let i = collumnsSelected.length-1; i >= 0; i--){
                collumnsCopied.push(collumnsSelected[i]);
            }
        }
    });

    $(document).keydown(function(e) {
        if (e.keyCode == 86 && e.ctrlKey) {// CRTL + V
            for(let i = 0; i < collumnsCopied.length; i++){
                let counter = 0, newName = '';
                for (let j = 0; j < datagen[currentDataGen].columns.length; j++){
                    if(datagen[currentDataGen].columns[j].name.includes(collumnsCopied[i].name)){
                        counter++;
                    }
                }
                if (counter > 0)
                    newName = collumnsCopied[i].name + '(' + counter + ')';
                else
                    newName = collumnsCopied[i].name;
                datagen[currentDataGen].addCollumn(newName, collumnsCopied[i].type, collumnsCopied[i].generator.copy());
            }
            collumnsSelected = [];
            showGenerators();
        }
    });
});

function generateDatas(){
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

/*Desenha na tela principal as colunas e seus respectivos geradores baseados nos dados armazendos no array datagen*/
function showGenerators(){
    let active_gen_chip;
    let $tbody = $("#tbody").empty();
    for(let i = 0; i < datagen[currentDataGen].columns.length; i++){
        let $tr = $("<tr/>");
        datagen[currentDataGen].columns[i].type = datagen[currentDataGen].columns[i].generator.getReturnedType();
        $tbody.append($tr
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
    try{
        let sample = datagen[currentDataGen].generateSample();
        preview(sample);
        ipc.send('change-datasample', sample);
    }catch (e){
        //TODO: alertar sobre erro de referência para o usuário.
        console.log(e);
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

    $("#modelsPane").children().removeClass('active');
    modelButton.addClass("active");
    $('#selectGeneratorType').empty().attr("disabled", true);
    $('#generatorPropertiesForm').empty();
    modelButton.mousedown(function(e) {
        switch (event.which) {
            case 1:
                if (currentDataGen !== pos){
                    currentDataGen = pos;
                    $("#modelsPane").children().removeClass('active');
                    $(this).addClass("active");
                    $('#selectGeneratorType').empty().attr("disabled", true);
                    $('#generatorPropertiesForm').empty();
                    showGenerators();
                }
                break;
            case 2:
                alert('Middle Mouse button pressed on ' + $(this).text());
                break;
            case 3:
                alert('Right Mouse button pressed on ' + $(this).text());
                break;
            default:
                alert('You have a strange Mouse!');
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
            let partsOfStr = targetPath.split('\\');
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
            let partsOfStr = targetPath.split('\\');
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

let margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 960 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;



let line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground;

let svg = d3.select(".canvas").append("svg")
    .attr("width", "100%")//width + margin.left + margin.right)
    .attr("height", "100%");//height + margin.top + margin.bottom)
let g1 = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

console.log();

let x = d3.scale.ordinal().rangePoints([50, $(svg[0][0]).width()-50], 0),
    y = {},
    dragging = {};

function preview(data){


    $(g1[0][0]).empty();
    
    // Extract the list of dimensions and create a scale for each.
    x.domain(dimensions = d3.keys(data[0]).filter(function(d) {
        let scale = isNaN(+data[0][d]) ?
            d3.scale.ordinal().domain(_.uniq(_.pluck(data, d))).rangePoints([$(svg[0][0]).height()-50, 0], 0):
            d3.scale.linear()
                .domain(d3.extent(data, function(p) { return +p[d]; }))
                .range([$(svg[0][0]).height()-50, 0]);

        return d !== "name" && (y[d] = scale);
    }));

    // Add grey background lines for context.
    background = g1.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = g1.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(data)
        .enter().append("path")
        // .style("stroke",  (...arguments) => {
        //     console.log(arguments);
        // });
        .attr("d", path);

    // Add a group element for each dimension.
    let g = g1.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        .call(d3.behavior.drag()
            .origin(function(d) { return {x: x(d)}; })
            .on("dragstart", function(d) {
                dragging[d] = x(d);
                background.attr("visibility", "hidden");
            })
            .on("drag", function(d) {
                dragging[d] = Math.min(width, Math.max(0, d3.event.x));
                foreground.attr("d", path);
                dimensions.sort(function(a, b) { return position(a) - position(b); });
                x.domain(dimensions);
                g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
            })
            .on("dragend", function(d) {
                delete dragging[d];
                transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
                transition(foreground).attr("d", path);
                background
                    .attr("d", path)
                    .transition()
                    .delay(500)
                    .duration(0)
                    .attr("visibility", null);
            }));

    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9)
        .text(function(d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.svg.brush().y(y[d]).on("brushstart", brushstart).on("brush", brush));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
}

function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
}

function transition(g) {
    return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
    return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
    d3.event.sourceEvent.stopPropagation();
}

// Handles a brush event, toggling the display of foreground lines.
function brush() {
    var actives = dimensions.filter(function(p) { return !y[p].brush.empty(); }),
        extents = actives.map(function(p) { return y[p].brush.extent(); });
    foreground.style("display", function(d) {
        return actives.every(function(p, i) {
            return extents[i][0] <= d[p] && d[p] <= extents[i][1];
        }) ? null : "none";
    });
}