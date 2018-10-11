let fs = require('fs');
const electron = require('electron').remote;
const dialog = electron.dialog;

let DataGen = require("./datagen/datagen.js");
let UniformGenerator = DataGen.listOfGens['Uniform Generator'];
let datagen = [new DataGen()];

let currentDataGen = 0;
let current_sample;
let activeGenerator;
let collumnsSelected = [];
let collumnsCopied = [];
let ipc = require('electron').ipcRenderer;

let vis = require("@labvis-ufpa/vistechlib");

let pc;

const createServer = require('./WebService');

createServer();

let WSMA = {};//It stores the models that is avaliable to web server (Web Server Model Available). It receives the model id, the boolean and the currentDatagen. Model is the Key.
let wsPort = 8000;
const Json2csvParser = require('json2csv').Parser;

ipc.on('call-datagen', function(event, arg){
    // ipc.send('receive-datagen', activeGenerator.getGenParams());
});
ipc.on('getDataModel', function(event, arg){
    // ipc.send('receive-datagen', activeGenerator.getGenParams());
    ipc.send('receive-dimension-generator', datagen[currentDataGen].exportModel());

    // if(collumnsSelected[0]){
    //     let fullGenerator = collumnsSelected[0].generator.getFullGenerator();
    //     let fullGenModels = [];
    //     for(let gen of fullGenerator){
    //         fullGenModels.push(gen.getModel());
    //     }
    //     ipc.send('receive-dimension-generator', JSON.stringify(fullGenModels));
    // }else{
    //     alert("Please, Select a Dimension.")
    // }
});
ipc.on('change-datagen', function(event, arg){
    for(let dtg of datagen){
        if(dtg.ID === arg.modelID){
            dtg.configs = arg;
            console.log( datagen[currentDataGen].configs);
            break;
        }
    }
    //console.log(datagen[currentDataGen].configs);
});
ipc.on('update-sampledata', function () {
    if(current_sample)
        ipc.send('change-datasample', current_sample);
});


$("html").ready(function(){
    showModels();

    $("#reloadPreview").on("click", "", function(e){
        showGenerators();
    });

    //The color lines became gray on resizing, so the reload solve the problem.
    $(window).on("resize", "", () => {
        showGenerators();
    })

    $("#hidePreview").on("click", "", function(e){
        $(".previewPanel").hide();
    });
    $("#showPreview").on("click", "", function(e){
        if($(".previewPanel").is(":visible")){
            $(".previewPanel").hide();
            $(this).attr("style", "float: left;");
        }
        else{
            $(".previewPanel").show();
            $(this).attr("style", "float: left; background-color: #ccc; color: black;");
        }
    });

    $("#modelsPane").on("dbclick", "span.nav-group-item", function(e){
        let i = $("#modelsPane span.nav-group-item").index(this);
        let title = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", title).blur(function(){
            datagen[i].name = $(this).val();
            showModels();
        }));
    });

    $.contextMenu({
        selector: 'span.nav-group-item',
        trigger: 'right',
        callback: function (key, options) {
            switch (key){
                case "Rename":
                    let i = datagen.indexOf(this.get(0).__node__);
                    let title = $(this).text();
                    $(this).empty();
                    $(this).append($("<input/>").attr("type", "text").attr("value", title).blur(function(){
                        datagen[i].name = $(this).val();
                        showModels();
                    }));
                    break;
                case "Delete": {
                    let index = datagen.indexOf(this.get(0).__node__);
                    if (index > -1) {
                        datagen.splice(index, 1);
                        if (index === currentDataGen)
                            currentDataGen = (index === 0) ? 0 : (index - 1);
                        else if (index < currentDataGen)
                            currentDataGen--;
                    }
                    showModels();
                    showGenerators();
                    break;
                }
                case "exportDot": {
                    console.log(this.get(0).__node__.exportDot());
                    let datastr = this.get(0).__node__.exportDot();
                    dialog.showSaveDialog({title:"Save Data", filters:[{name:"Graph",extensions:["dot"]}]}, function(targetPath) {
                        if(targetPath){
                            fs.writeFile(targetPath, datastr, (err) => {
                                if (err) throw err;
                            });
                        }
                    });
                    break;
                }
                case "CopyModelId": {
                    const {clipboard} = require('electron');
                    let i = datagen.indexOf(this.get(0).__node__);
                    let varModelID = datagen[i].ID;
                    if(process.platform == 'darwin') {
                        console.log(varModelID);
                        clipboard.writeText(varModelID,'selection');
                    }else {
                        clipboard.writeText(varModelID);
                    }
                    break;
                }
                case "ToggleWS": {
                    let i = datagen.indexOf(this.get(0).__node__);
                    let htmlItem = $(".fa-upload").eq(i);
                    let varModelID = datagen[i].ID;
                    if(!(varModelID in WSMA)) {
                        WSMA[varModelID] = [true,i];
                        htmlItem.css("visibility","visible");
                    }
                    else if(WSMA[varModelID][0]) {
                        WSMA[varModelID] = [false,i];
                       htmlItem.css("visibility","hidden");
                    } else {
                        WSMA[varModelID] = [true,i];
                        console.log( WSMA[varModelID][1]);
                        htmlItem.css("visibility","visible");
                    }
                    break;
                }
                case "OpenWS": {
                    let i = datagen.indexOf(this.get(0).__node__);
                    let htmlItem = $(".fa-upload").eq(i);
                    let varModelID = datagen[i].ID;
                    if(!(varModelID in WSMA)) {
                        WSMA[varModelID] = [true,i];
                        htmlItem.css("visibility","visible");
                    }
                    require("electron").shell.openExternal("http://localhost:"+wsPort+"/?modelID="+datagen[i].ID+"&nsample="+datagen[i].n_lines);
                    break;
                }
                default:
                    console.log("nenhum");
                    break;
            }
        },
        items: {
            "Rename": {name: "Rename"},
            "Delete": {name: "Delete"},
            "exportDot": {name: "Export .DOT File"},
            "CopyModelId": {name: "Copy Model Id"},
            "ToggleWS": {name: "Toggle WebService"},
            "OpenWS": {name: "Open out WebService"}
        }
    });

    $("#tableCollumn").on("dblclick", "td.columnName", function(){
        let title = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", title).blur(function(){
            let cor = $(this).val();
            for (let i = 0; i < datagen[currentDataGen].columns.length; i++){
                if (cor === datagen[currentDataGen].columns[i].name){
                    $(this).parent().parent().get(0).__node__.name = title;
                    $(this).parent().text(title);
                    alert("Dimension name already exists");
                    return;
                }
            }
            $('#comboBoxPreview option:contains('+title+')').text(cor).val(cor); //Change the option name according with dimension name.
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

        else if($input.attr("data-type") === "options")
            this.__node__[$input.attr("data-variable")] = $input.val();

        else if($input.attr("data-type") === "array")
            this.__node__[$input.attr("data-variable")] = $input.val().split(",");

        else if($input.attr("data-type") === "boolean")
            this.__node__[$input.attr("data-variable")] = $input.get(0).checked;

        else if($input.attr("data-type") === "Generator")
            this.__node__[$input.attr("data-variable")] = new (DataGen.listOfGens[$input.val()])();

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

    $("#tableCollumn").on("mousedown", "div.md-chip", configGenProps);


    $.contextMenu({
        selector: '#selectGeneratorType',
        trigger: 'none',
        callback: function (key) {
            let nameNewGenerator = key;
            let newGen = new (DataGen.listOfGens[nameNewGenerator])();
            //substitui o gerador na estrutura.
            this[0].__node__.changeGenerator(newGen);
            activeGenerator = newGen;

            let $active_chip = showGenerators();
            configGenProps.apply($active_chip.get(0));
            datagen[currentDataGen].resetAll();
        },
        items: configureMenuOfGens()
    });
    $("#selectGeneratorType").on("click", function(e){
        $(this).contextMenu();
    });

    $("#rowsQtInput").blur(function(){
        $(".tooltiptext").css("visibility", "hidden").css("opacity", 0);
    });

    $("#btnConfigGeneration").click(function(){
        let configs = datagen[currentDataGen].configs;
        configs.modelID = datagen[currentDataGen].ID;
        configs.modelName = datagen[currentDataGen].name;
        ipc.send('open-config-datagen-window', configs);
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
        $(this).parent().find("div.md-chip").get(l).__node__.addGenerator(new UniformGenerator());
        showGenerators();
    });

    $("#tableCollumn").on("click", "td.btnRemoveColumn", function(){
        datagen[currentDataGen].removeCollumn(parseInt($(this).parent().find(".tdIndex").text()) - 1);
        showGenerators();
    });

    $("#tableCollumn").on("click", "td.btnFilter", function(){
        //Get the selected dimension.
        let colu = datagen[currentDataGen].columns[parseInt($(this).parent().find(".tdIndex").text()) - 1];
        colu.display = colu.display == true ? false : true;
        //If the dimension selected to filter were the current dimension on preview, the color lines in preview would be black.
        if(colu.name == selectColumnPreview) {
            for(let col of datagen[currentDataGen].columns){
                if(col.display) {
                    selectColumnPreview = col.name;
                    break;
                }
            }
        }
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
        console.log("Testando um dois tres");
        let col = $(this).parent().parent().get(0).__node__;
        let i = collumnsSelected.indexOf(col);
        if ($(this).is(':checked')){
            //TODO: colocar o filtro em outro componente gráfico.
            col.display = true;
            if (i === -1){
                collumnsSelected.push(col);
            }
        } else if (i !== -1){
            col.display = false;
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
                datagen[currentDataGen].addCollumn(newName, collumnsCopied[i].generator.copy());
            }
            collumnsSelected = [];
            showGenerators();
        }
    });

    dragAndDropGens();

});

let modal = document.getElementById('myModal');

function generateDatas(){
    try {
        modal.style.display = "block";
        let saveas = datagen[currentDataGen].save_as;
        if (datagen[currentDataGen].configs.iterator.hasIt) {
            dialog.showSaveDialog({
                title: "Save Data",
                filters: [{name: saveas, extensions: [saveas]}]
            }, function (targetPath) {
                modal.style.display = "none";
                if (targetPath) {
                    let it = datagen[currentDataGen].configs.iterator;
                    let prevValue = it.generator[it.parameterIt];
                    it.generator[it.parameterIt] = it.beginIt;
                    for (let i = 0; i < it.numberIt; i++) {
                        $("#percentageGD").text("Starting...");
                        setTimeout(() => {
                            generateStream(targetPath.replace(/(.*)(\.\w+)$/g, (match, p1, p2) => {
                                return p1 + "[" + i + "]" + p2;
                            }));
                        },100);

                        it.generator[it.parameterIt] += it.stepIt;
                    }
                    it.generator[it.parameterIt] = prevValue;
                }
            });
        } else {
            dialog.showSaveDialog({
                title: "Save Data",
                filters: [{name: saveas, extensions: [saveas]}]
            }, function (targetPath) {
                modal.style.display = "none";
                if (targetPath) {
                    //generateStream(targetPath);
                    $("#percentageGD").text("Starting...");
                    setTimeout(() => {
                        generateStream(targetPath);
                    },100);
                }
            });
        }
    }catch (e) {
        console.log(e);
        alert('Some problem happened!!! Verify generators properties.\n' +
            'Tips:\n' +
            '     * Be sure that Input Property of Function Generators isn\'t null ');

        modal.style.display = "none";
    }
}

function generateStream(file) {
    const fs = require('fs');
    const datagenBackup = jQuery.extend(true, {}, datagen);
    const currentDBackup = currentDataGen;
    const varSeparator =  this.save_as === "csv" ? ',' : '\t';
    let writeStream  = fs.createWriteStream(file);
    writeStream.write('[');

    const csvWriter = require('csv-write-stream')
    let writer = csvWriter({separator: varSeparator});


    writer.pipe(fs.createWriteStream(file));

    for (let i = 0; i < datagenBackup[currentDBackup].n_lines; i++) {
        let data = !datagenBackup[currentDBackup].header ? [] : {};
        for (let j = 0; j < datagenBackup[currentDBackup].columns.length; j++){
            if(datagenBackup[currentDBackup].columns[j].display) {
                if(!datagenBackup[currentDBackup].header){
                    data.push(datagenBackup[currentDBackup].columns[j].generator.generate());
                } else {
                    data[datagenBackup[currentDBackup].columns[j].name] = datagenBackup[currentDBackup].columns[j].generator.generate();
                }
            }
        }
        switch(datagenBackup[currentDBackup].save_as) { //In-for
            case "json":
                writeStream.write(JSON.stringify(data)+(i == datagenBackup[currentDBackup].n_lines -1 ? '' : ','));
                break;
            case "csv":
            case "tsv":
                writer.write(data);
                break;
        }
        if(i%100==0) {
            setTimeout(() => {
                $("#percentageGD").text(String((i)*100/datagenBackup[currentDBackup].n_lines)+"%");
            },100);

        }

    }

    switch(datagenBackup[currentDBackup].save_as) {//Pós-for
        case "json":
            setTimeout(() => {
                $("#percentageGD").text("Saving...");
            },100);

            writeStream.end(']');
            break;
        case "csv":
        case "tsv":
            setTimeout(() => {
                $("#percentageGD").text("Saving...");
            },100);
            writer.end();
            break;
    }

    writeStream.on('finish', () => {
        $("#percentageGD").text("Finish!");
        alert('Data Saved');
    });
    writer.on('finish', () => {
        $("#percentageGD").text("Finish!");
        alert('Data Saved');
    });
    datagenBackup[currentDBackup].resetAll();
}

function addGenerator(){
    datagen[currentDataGen].addCollumn("Dimension "+(++datagen[currentDataGen].columnsCounter));
    showGenerators();
}

function dragGenerator(evt){
    let params = evt.target.__node__.getGenParams();
    let genID = evt.target.__node__.ID;
    let genModel = evt.target.__node__.getModel();
    let modelID = datagen[currentDataGen].ID;
    let modelName = datagen[currentDataGen].name;
    let col = $(evt.target).parent().parent().get(0).__node__;
    let colName = col.name;
    let colID = col.ID;
    evt.dataTransfer.setData("text/plain", JSON.stringify({modelID, modelName, colID, colName, genID, genModel, params}));
}

function dragAndDropGens(){
    let dragged = {};
    $(".md-chip").on("drop",function(event){
        event.preventDefault();
        event.stopPropagation();

        if (dragged.generator){
            dragged.parent.generator = dragged.generator;
            dragged.generator.parent = dragged.parent;
            dragged.generator.sumOrder();
        }
        else{
            if (dragged.parent.ID.substring(0,3) === "COL"){
                let newGen = new DataGen.listOfGens["Uniform Generator"]();
                newGen.parent = dragged.parent;
                dragged.parent.generator = newGen;
            }else{
                dragged.parent.generator = null;
            }
        }

        if (event.target.__node__.generator){
            dragged.parent = event.target.__node__;
            event.target.__node__.generator.parent = dragged;

            dragged.generator = event.target.__node__.generator;
            event.target.__node__.generator = dragged;
        }else{
            event.target.__node__.generator = dragged;
            dragged.parent = event.target.__node__;
            dragged.generator = null;
        }
        event.target.__node__.sumOrder();

        showGenerators();
    }).on("dragover", function(event) {
        event.preventDefault();
        event.stopPropagation();
    }).on("dragleave", function(event) {
        event.preventDefault();
        event.stopPropagation();
    }).on("dragstart", function(event){
        event.stopPropagation();
        dragged = event.target.__node__;
    });
}

/*Desenha na tela principal as colunas e seus respectivos geradores baseados nos dados armazendos no array datagen*/
function showGenerators(){
    function displayGens($tdGen, generator, active_gen_chip){
        let generators = [];
        generator.getFullGenerator(generators);

        for(let gen of generators){
            if (gen instanceof DataGen.superTypes.SwitchCaseFunction){
                let $switchGenTable = $("<table/>");
                let $chip = $("<div/>").addClass("md-chip md-chip-hover").text(gen.order + "-" + gen.name).attr("draggable","true");
                $chip.get(0).ondragstart = dragGenerator;
                if(gen === activeGenerator)
                    active_gen_chip.obj = $chip.addClass("active-md-chip");
                $chip.get(0).__node__ = gen;
                $tdGen.append($chip);

                let $switchGenTr;
                let flag = false;
                let listOfGenSwitchFunction = gen.listOfGenerators;
                for (let c in listOfGenSwitchFunction){
                    if(listOfGenSwitchFunction.hasOwnProperty(c)){
                        $switchGenTr = $("<tr/>");
                        if (!flag){
                            $switchGenTr.append($("<td/>").attr("rowspan", Object.keys(listOfGenSwitchFunction).length).append($chip));
                            flag = true;
                        }
                        $switchGenTr.append($("<td/>").text(c));
                        let $td = $("<td/>").addClass("columnGen");

                        displayGens($td, listOfGenSwitchFunction[c], active_gen_chip);
                        $switchGenTr.append($td);
                        $switchGenTable.append($switchGenTr);
                    }
                }
                $tdGen.append($("<div/>").css("display","inline-block").append($switchGenTable));
                break;
            }else{
                let $chip = $("<div/>").addClass("md-chip md-chip-hover").text(gen.order + "-" + gen.name).attr("draggable","true");
                $chip.get(0).ondragstart = dragGenerator;
                if(gen === activeGenerator)
                    active_gen_chip.obj = $chip.addClass("active-md-chip");
                $chip.get(0).__node__ = gen;
                $tdGen.append($chip);
            }
        }

        $tdGen.append($("<span/>")
            .addClass("btnGenerator btnAddGen icon icon-plus-circled")
        ).append($("<span/>")
            .addClass("btnGenerator btnRemoveGen icon icon-trash")
        );
    }

    let active_gen_chip = {};
    let $tbody = $("#tbody").empty();
    if (datagen.length > 0){
        for(let i = 0; i < datagen[currentDataGen].columns.length; i++){
            let $tr = $("<tr/>");
            datagen[currentDataGen].columns[i].type = datagen[currentDataGen].columns[i].generator.getReturnedType();
            let c = false;
            for (let y = 0; y < collumnsSelected.length; y++){
                if (datagen[currentDataGen].columns[i].name === collumnsSelected[y].name){
                    c = true;
                }
            }

            $tbody.append($tr
                .append($("<td/>").append($("<input/>").attr("type", "checkbox").prop("checked", c).addClass("checkboxSelectColumn")))
                .append($("<td/>").text(i+1).addClass("tdIndex"))
                .append($("<td/>").text(datagen[currentDataGen].columns[i].name).addClass("columnName"))
                .append($("<td/>").text(datagen[currentDataGen].columns[i].type).addClass("columnType"))
            );

            let $tdGen = $("<td/>").addClass("columnGen");

            //chama a função recursiva de desenho.
            displayGens($tdGen, datagen[currentDataGen].columns[i].generator, active_gen_chip);

            $tr.append($tdGen);

            let slash = datagen[currentDataGen].columns[i].display == false ? "-slash": "";

            $tr.append($("<td/>").addClass("btnGenerator btnFilter fa fa-filter"+slash+" fa-lg"));

            $tr.get(0).__node__ = datagen[currentDataGen].columns[i];
            $tr.append($("<td/>").addClass("btnGenerator btnRemoveColumn icon icon-trash"));
        }

        dragAndDropGens();
    }
    try{
        current_sample = datagen[currentDataGen].generateSample();
        preview(current_sample);
        ipc.send('change-datasample', current_sample);
    }catch (e){
        //TODO: alertar sobre erro de referência para o usuário.
        switch (e) {
            case 'Please, insert a sentence.':
                alert(e);
        }
        console.log(e);

    }
    return active_gen_chip.obj;
}

/*putGeneratorOptions
* Entradas: select - Lista que será mostrada na hora da seleção
*           selected - Opção que já deverá aparecer selecionada
*           noise - Booleano que indica se os geradores retornados serão geradores de ruídos ou não
* Saída: Lista de geradores que serão mostradas em tags select's
* */
function putGeneratorOptions(select, selected, noise) {
    let list = noise ? DataGen.listOfGensForNoise : DataGen.listOfGens;
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

        }else if(p.type === "options") {
            let $input = $("<select/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            for(let opt of p.options){
                $input.append($("<option/>").attr("value", opt).text(opt));
            }
            $input.val(generator[p.variableName]);
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

                    //Verifica se o tipo das dimensões anteriores é compatível com o tipo de dimensão esperado pela função.
                    if(p.type.indexOf(datagen[currentDataGen].columns[i].type) < 0 )
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

function reloadWSIcon () {
    for(let item in WSMA) {
        console.log(item);
        if(WSMA[item][0]) {
            $(".fa-upload").eq(WSMA[item][1]).css("visibility","visible");
        }
    }
}

function showModels(){
    $("#modelsPane").empty();
    $("#modelsPane").append($("<h5/>").addClass("nav-group-title").text("Models"));
    for(let i = 0; i < datagen.length; i++){
        let idNameModel = datagen[i].name.toLowerCase().replace(' ','');

        let modelButton = $("<span/>").attr('id', idNameModel).addClass("nav-group-item").text(datagen[i].name).append($("<span/>").addClass("icon").addClass("icon-doc-text-inv")).append($("<span/>").addClass("fa").addClass("fa-upload"));

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
                    console.log('Middle Mouse button pressed on ' + $(this).text());
                    break;
                case 3:
                    //ipc.send('context-menu-datamodel', {x: e.pageX, y: e.pageY, m: i});
                    break;
                default:
                    console.log('You have a strange Mouse!');
            }
        });
        modelButton.get(0).__node__ = datagen[i];
        $("#modelsPane").append(modelButton);
    }
    reloadWSIcon();
}

function createNewModel () {
    datagen.push(new DataGen());
    datagen[datagen.length-1].name += " " + datagen.length;
    currentDataGen = datagen.length-1;
    showModels();
    showGenerators();
}

function createExportModel (path) {
    fs.writeFile(path, datagen[currentDataGen].exportModel(), (err) => {
        if (err) throw err;
    });
    alert('Model Exported Successfully!');
}

function createImportModel (modelName, data) {
    let dg = new DataGen();
    dg.columns = [];
    dg.importModel(data);
    dg.name = modelName;
    datagen.push(dg);
    let pos = (datagen.length-1);
    currentDataGen = pos;
    showModels();
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

    dialog.showSaveDialog({title:"Save Generated DataSet", filters:[filt]}, function(targetPath) {
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

    dialog.showSaveDialog({title:"Save Generated DataSet", filters:[{name: 'JSON', extensions:['json']}]}, function(targetPath) {
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


function createModelFromDataSet(path){

    console.log(path);

    fs.readFile(path, "utf-8", (err, strdata) => {
        if(err){
            alert("Failed to load the dataSet. Verify if it is UTF-8 encoded.");
            alert(err);
            // data
        }else{
            let data = [];
            let columns;
            if(path.endsWith(".csv") || path.endsWith(".tsv")){
                console.log("Selecionou um CSV", path);
                let lines;
                if(strdata.indexOf("\r\n") >= 0){
                    lines = strdata.split("\r\n");
                }else{
                    lines = strdata.split("\n");
                }
                for(let i=0;i<lines.length;i++){
                    lines[i] = lines[i].split(path.endsWith(".csv") ? "," : "\t");
                }
                //TODO: pedir para o usuário converter os valores

                for(let i=0;i<lines[0].length;i++){
                    lines[0][i] = lines[0][i].replace(/^"(.+)"$/g, (m, p1) => { return p1; });
                }
                columns = lines[0];
                for(let i=1;i<lines.length;i++){
                    data.push({});
                    for(let j=0;j<lines[i].length;j++){
                        if(isNaN(+lines[i][j])){
                            data[data.length-1][lines[0][j]] = lines[i][j];
                        }else{
                            data[data.length-1][lines[0][j]] = +lines[i][j];
                        }
                    }
                }
            }else if(path.endsWith(".json")){
                console.log("Selecionou um JSON", path);
                data = JSON.parse(strdata);
                columns = [];
                for(let p in data[0]){
                    if(data[0].hasOwnProperty(p))
                        columns.push(p);
                }
            }
            console.log(data);
            console.log(columns);

            let createdDatagen = new DataGen();
            datagen.push(createdDatagen);
            currentDataGen = datagen.length-1;

            //Altera as propriedades do Datagen
            createdDatagen.name = path.slice(path.lastIndexOf("\\")+1, path.lastIndexOf("."));
            createdDatagen.hasRealData = true;
            createdDatagen.realDataLength = data.length;
            createdDatagen.n_lines = data.length;
            createdDatagen.n_sample_lines = data.length;

            //Adiciona Colunas com base nos dados Reais.
            createdDatagen.columns.splice(0,1);
            for(let c of columns){
                createdDatagen.addCollumn(c, new DataGen.listOfGensComplete['Real Data Wrapper'](_.pluck(data, c)));
            }

            showModels();
            showGenerators();

        }
    });
}

//Redraw the options on preview's comboBox.
function optionsPreview() {
    $("#comboBoxPreview").empty();
    for(let col of datagen[currentDataGen].columns) {
        if(col.display)
            $('#comboBoxPreview').append($('<option>', {value:col.name, text:col.name}));
    }
}
let selectColumnPreview = "Dimension 1"; //Inicialize according the first columns's name.

$('#comboBoxPreview').change(() => {
    selectColumnPreview = $("#comboBoxPreview").val();
    showGenerators(); //To redraw the preview;
    $("#comboBoxPreview").val(selectColumnPreview); //Because the preview is redrawn, the chosen option is lost. This line recover the choice.

});

function preview(data2){
    //console.log(data2);
    if(pc === undefined) {
        pc = new vis["ParallelCoordinates"]($("#previewCanvas").get(0));
    }

    //Set the data into ParallelCoordinates, so it is able to appear on preview.
    pc.data(data2);
    pc.redraw();

    let scaleFunction;
    let range; //range of colors.

    optionsPreview(); //Call the function for a comboBox options redrawing.

    //Set configs according to the dimension type.
    for(let col of datagen[currentDataGen].columns) {
        if(col.name == selectColumnPreview) {
            switch(col.type) {
                case "Categorical":
                    scaleFunction = d3.scaleOrdinal();
                    range = d3.schemeCategory10;
                    break;
                case "Numeric":
                    scaleFunction = d3.scaleLinear();
                    range = ["blue", "red"];
                    break;
            }
            break;
        }
    }


    //Get the chosen dimension values to calculate the domain.
    /*This is necessary because data2 is a object of objects, so there is no way to use Object.values() for exemple*/
    let dataArray = [];
    data2.forEach(function(item){
        dataArray.push(item[selectColumnPreview]);
    });

    //Set the coloration logic.
    let scale = scaleFunction.domain(d3.extent(dataArray)).range(range);

    //Color each line.
    pc.foreground.selectAll('path')
        .style("stroke",(d) => {
            return scale(d[selectColumnPreview]);
        });

    /*
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
    */

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

function configureMenuOfGens(){
    let types = ["Sequence", "Random", "Function", "Accessory"];
    let menuObj = {};

    for(let t of types){
        menuObj[t] = {name: t, items: {}};
    }

    for(let prop in DataGen.listOfGens){
        menuObj[DataGen.listOfGens[prop].genType].items[prop] = {};
        menuObj[DataGen.listOfGens[prop].genType].items[prop].name = prop;
    }
    return menuObj;
}
