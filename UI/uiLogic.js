
//------- Importando as variáveis que vem do ambiente do Node.js
// const fs = require('fs');
const fs = window.mainVariables.fs;
// console.log(window.mainVariables);
// const net = require('net');
const net = window.mainVariables.net;
// const { promisify } = require('util');
const promisify = window.mainVariables.promisify;
// const electron = require('electron').remote;
const electron = window.mainVariables.electron;
// const {clipboard} = require('electron');
const clipboard = window.mainVariables.clipboard;
// const path = require('path');
const path = window.mainVariables.path;
// const _ = require('lodash');
const _ = window.mainVariables._;
// const DataGen = require("./datagen/datagen.js");
const DataGen = window.mainVariables.DataGen;
// let ipc = require('electron').ipcRenderer;
const ipc = window.mainVariables.ipc;
// let vis = require("@labvis-ufpa/vistechlib");
let vis = window.mainVariables.vis;
window.mainVariables.onload = () => { 
    vis = window.mainVariables.vis;
    showGenerators();
}
// const Json2csvParser = require('json2csv').Parser;
const Json2csvParser = window.mainVariables.Json2csvParser;
// const {createServer,closeServer,changePort} = require('./WebService');
const {createServer,closeServer,changePort} = window.mainVariables;

const process = window.mainVariables.process;

//------------------


const dialog = electron.dialog;

const BrowserWindow = electron.BrowserWindow;


let UniformGenerator = DataGen.listOfGens['Uniform Generator'];
let datagen = [new DataGen()];

let currentDataGen = 0;
let current_sample;
let activeGenerator = [];
let collumnsSelected = [];
let collumnsCopied = [];
let lastCollumnSelected;
let lastCollumnSelectedColor;

const exist = promisify(fs.access);
const save = promisify(rawSave);
const writeFile = promisify(fs.writeFile);
const mk = promisify(fs.mkdir);
const readFile = promisify(fs.readFile);
const readDir = promisify(fs.readdir);
const del = promisify(fs.unlink);
const stats = promisify(fs.stat);
const appendFile = promisify(fs.appendFile);

let generatorEspecialPaste;
let especialPasteState = 0; //0-Desativado, 1-Cola uma vez, 2-Cola até clicar de voltano botão, 3-Magic

let generating = false; //Avoid more then 1 generation at a time, include local and Distributed generation. 


let pc;



let wsActive = false;
let wsPort = 8000;
let WSMA = {};//Note: It must be out of DataGen library! It stores the models that is avaliable to web server (Web Server Model Available). It receives the model id, the boolean and the currentDatagen. Model is the Key.

let distributedSystemSocket;



let stopGeneration = false; // Stop Data Generation.
let itFiles = []; //Save the index and paths of Iterator Files.

const tmpDir = process.platform === "darwin" || process.platform === "linux" ? path.join("/", "var", "tmp") : process.platform === "win32" ? String(process.env.temp) : false;
const platformASpath = tmpDir === false ? false : path.join(tmpDir, "B_DataGen_AS");

(async () => {
    if ( platformASpath !== false && !await access(platformASpath) )
        await mk(platformASpath);
})()

async function access(path) {
    try {
        await exist(path)
        return true
    } catch(e) {
        if(e.message.includes('ENOENT')) return false
        else
            throw new Error('Bad Access file or folder.')
    }
}


ipc.on('call-datagen', function(){// ipc.send('receive-datagen', activeGenerator[currentDataGen].getGenParams());
});

ipc.on('delete-dimension', function(){
    deleteCollumn();
})

ipc.on('delete-model',() => {
    deleteModel(currentDataGen);
})

ipc.on('alert', function(event, message) {
    alert(message);
})

let paths = []
ipc.on('get-path', function(event, allPath){
    paths = allPath;
    let path = '';
    allPath.forEach((e,i) => {
        path += e.path;
    });
    //TODO: Pegar o path por aqui
    if(activeGenerator[currentDataGen] instanceof DataGen.superTypes["Geometric"]){
        activeGenerator[currentDataGen].path = path;
        activeGenerator[currentDataGen].accessPath = path;
        $('#input_accessPath').val(path);
        console.log(activeGenerator[currentDataGen]);
        showGenerators();
    }
});

ipc.on('open-datagen', async function(event, path){
    console.log(event, path)
    await openModel(path);
    showModels();
    showGenerators();
});

async function openModel (path, backup=false) {
    const file = await readFile(path.toString(), 'utf8')
    try {
        let dg = new DataGen();
        dg.columns = [];
        try{
            dg.importModel(file);
        } catch(e) {
            console.log(e);
            if(!e.message.includes("Real Data Wrapper is strange!"))
                throw new Error("Something Bad Happened")
        }

        datagen.push(dg);
        const lastIndex = datagen.length-1
        if(!!backup) {
            if(!datagen[lastIndex].name.includes("[Backup]"))
                datagen[lastIndex].name = `${datagen[lastIndex].name} [Backup]`;
            datagen[lastIndex].datagenChange = true;
            await createExportModel(`${platformASpath}${datagen[lastIndex].ID}.json`, lastIndex);
        } else {
            datagen[lastIndex].filePath = path;
        }
        return true
    } catch (e) {
        throw new Error("Something Bad Happened")
    }
}

ipc.on('undo-datagen', function(){desrefazer("restore");});

ipc.on('redo-datagen', function(){desrefazer("forward");});

function desrefazer (act){
    let idChange;
    if(activeGenerator[currentDataGen])
        idChange = activeGenerator[currentDataGen].ID;
    datagen[currentDataGen][act]();
    if(activeGenerator[currentDataGen])
        activeGenerator[currentDataGen] = datagen[currentDataGen].findGenByID(idChange);
    showGenerators();
    showModels();
    if(activeGenerator[currentDataGen])
        propsConfigs(activeGenerator[currentDataGen], activeGenerator[currentDataGen].getRootGenerator().parent)
}

ipc.on('export-datagen', function(event, type, dtIndex){save(type,dtIndex); });

async function rawSave(type, dtIndex) {
    let index = dtIndex !== undefined ? dtIndex : currentDataGen;
    switch(type) {
        case "save":
            if(!datagen[index].datagenChange) break;
            if(datagen[index].filePath === undefined) {
                let saveScreen = new BrowserWindow({show: false, alwaysOnTop: true});
                dialog.showSaveDialog(
                    saveScreen,
                    {
                        title:"Save Model",
                        filters: [
                            {
                                name: 'json',
                                extensions: ['json']
                            }
                        ]
                }).then(({canceled, filePath}) => {
                    if(canceled) return;
                    datagen[index].filePath = filePath;
                    const name = path.basename(filePath,'.json');
                    if(confirm(`Do you want to change the model's name to '${name}'?`)) {
                        datagen[index].name = name;
                    }
                    exportAndSave()
                });
            } else exportAndSave();
            async function exportAndSave() {
                try {
                    if(!datagen[index].filePath) throw new Error('No path to save found.');
                    await createExportModel(datagen[index].filePath, index)
                    datagen[index].datagenChange = false;
                    showModels();
                    showGenerators();
                } catch(e) {
                    console.error(e);
                    throw new Error("Saved Failed");
                }
            }
            break;
        case "saveas":
            let saveScreen = new BrowserWindow({show: false, alwaysOnTop: true});
            dialog.showSaveDialog(
                saveScreen,
                {
                    title:"Save Model As",
                    filters: [
                        {
                            name: 'json',
                            extensions: ['json']
                        }
                    ]
            }).then(({canceled, filePath}) => {
                if(canceled) return;
                if(datagen[index].filePath === undefined) {
                    datagen[index].filePath = filePath; //Otherwise could be only a copy
                    datagen[index].name = path.basename(targetPath,'.json');
                }
                try {
                    createExportModel(targetPath);
                } catch(e) {
                    throw new Error('exportModel failed!')
                }
            });
            break;
    }
}

ipc.on('getDataModel', function(){
    // ipc.send('receive-datagen', activeGenerator[currentDataGen].getGenParams());
    ipc.send('receive-dimension-generator', datagen[currentDataGen].exportModel());
});

ipc.on('change-datagen', function(event, arg){
    for(let dtg of datagen){
        if(dtg.ID === arg.modelid){
            dtg.configs = arg;
            break;
        }
    }
    hasChanged();
});

ipc.on('change-WebService', function(event, arg){
    if(arg.hasOwnProperty("wsPort")) {
        if(arg.wsPort > 1) {
            if(wsActive) {
                closeServer();
                createServer();
                wsPort = arg.wsPort;
                changePort(wsPort);
            }
        }
    }
    if(arg.hasOwnProperty("wsActive")) {
        if(wsActive != arg.wsActive) {
            wsActive = arg.wsActive;
            if (wsActive) {
                createServer();
                changePort(wsPort);
            } else {
                closeServer();
                $(".fa-upload").each( (index) => {
                    $(".fa-upload").eq(index).css("visibility","hidden");
                })
            }
        }
    }
});

ipc.on('change-DistributedSystem', function(event, arg){
    console.log(arg)
    if(arg.hasOwnProperty("dsPort")) {
        datagen[currentDataGen].dsPort = arg["dsPort"]
    }
    if(arg.hasOwnProperty("dsIpAddress")) {
        datagen[currentDataGen].ddIpAddress = arg["dsIpAddress"]
    }
});

ipc.on('update-sampledata', function () {
    if(current_sample)
        ipc.send('change-datasample', current_sample);
});

function propsConfigs(generator,coluna, new_place){
    let params = generator.getGenParams();

    //Ativa o <select> e coloca as opções de Geradores para trocar o tipo do gerador.
    let $selectGenType = $("#selectGeneratorType").removeAttr("disabled").empty();
    putGeneratorOptions($selectGenType, generator.name);
    $selectGenType.get(0).__node__ = generator;

    let $propForms = $(new_place || "#generatorPropertiesForm");
    $propForms.empty();

    let $table = $("<table/>")
        .attr("id","propertiesTable")
        .attr("class", "propTable");
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

        }else if(p.type === "file"){
            let $input = $("<input/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("type","file")
                .attr("value", generator[p.variableName])
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type)
                .css("display", "none");
            let $labelFile = $("<label/>")
                .addClass("btn btn-mini btn-default")
                .text("Choose File")
                .attr("for", "input_"+p.variableName)
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input).append($labelFile));

        }else if(p.type === "folder"){
            let $input = $("<input/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("type","file")
                .attr("value", generator[p.variableName])
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type)
                .prop("webkitdirectory", true)
                .prop("directory", true)
                .prop("multiple", true)
                .css("display", "none");
            let $labelFile = $("<label/>")
                .addClass("btn btn-mini btn-default")
                .text("Choose Folder")
                .attr("for", "input_"+p.variableName)
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input).append($labelFile));
            console.log(generator);

        }else if(p.type === "auto" || p.type === "string" || p.type === "Generator") {
            let $input;
            if (generator.name === "Path2D Stroke Generator" || generator.name === "Path2D Fill Generator"){
                $input = $("<textarea/>");
                $input.val(generator.path);
            } else {
                $input = $("<input/>").attr("value", generator[p.variableName]);
            }
            $input.addClass("form-control")
                .addClass("smallInput")
                .attr("type","text")
                //.attr("value", generator[p.variableName])
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);

            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input));
            if(p.type === "Generator"){
                let genSel = generator[p.variableName];
                $input.val(genSel ? genSel.ID : "");
                $input.on("drop", function(evt){
                    evt.preventDefault();
                    evt.stopPropagation();

                    let msg = evt.originalEvent.dataTransfer.getData("text");
                    let objs = JSON.parse(msg);
                    $input.val(objs.genID);
                    $input.trigger("change");
                });
            }

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

            // }else if(p.type === "Generator"){// Utiliza os geradores das colunas anteriormente criadas no mesmo model
            //     let $select = $("<select/>")
            //         .addClass("form-control")
            //         .addClass("smallInput")
            //         .attr("id", "input_"+p.variableName)
            //         .attr("data-variable", p.variableName)
            //         .attr("data-type", p.type);
            //     $select.get(0).__node__ = generator;
            //     putGeneratorOptions($select, generator[p.variableName], true);
            //     $tr.append($("<td/>").append($select));

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
                $select.prepend($("<option/>").attr("selected", "selected").attr("value","null").text("Null"));
            }

            $tr.append($("<td/>").append($select));
        }
    }
    tippy('.tooltip-label');
}

$("html").ready(function() {

    showModels();

    verifyBackupModels().then(() => {
        showModels();
    })

    $("#reloadPreview").on("click", "", function(e){
        showGenerators();
    });

    //The color lines became gray on resizing, so the reload solve the problem.
    $(window).on("resize", "", () => {
        showGenerators();
    });

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
        selector: 'ul li.tabButton',
        trigger: 'right',
        callback: function (key) {
            const i = datagen.indexOf(this.get(0).__node__);
            switch (key){
                case "Rename": {
                    renameModel(i)
                    break;
                }
                case "Delete": {
                    deleteModel(i);
                    break;
                }
                case "exportDot": {
                    let datastr = this.get(0).__node__.exportDot();
                    exportModelDot(datastr)
                    break;
                }
                case "CopyModelId": {
                    CopyModelId(i)
                    break;
                }
                case "ToggleWS": {
                    toggleWS(i)
                    break;
                }
                case "OpenWS": {
                    openWS(i)
                    break;
                }
                case "URIWS": {
                    uriWS(i)
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
            "URIWS": {name: "Copy URI Web Service"},
            "ToggleWS": {name: "Toggle Web Service"},
            "OpenWS": {name: "Open out Web Service"}
        }
    });

    $("#leftSideBar").on("blur", "#collumnName", function(){
        let newName = $(this).val();
        let colID = $("#collumnID").text();
        let flag = true; let index = 0; let index2 = 0;

        for (let i = 0; i < datagen[currentDataGen].columns.length; i++){
            if (newName === datagen[currentDataGen].columns[i].name){
                if (colID !== datagen[currentDataGen].columns[i].ID){
                    setModalPadrao("Error!", "Dimension name already exists", "error");
                }
                flag = false;
            }else{
                if (colID === datagen[currentDataGen].columns[i].ID){
                    index2 = i;
                    if (flag) index = i;
                }
            }
        }

        if (flag){
            datagen[currentDataGen].columns[index].name = newName;
            showGenerators();
        }else{
            $(this).val(datagen[currentDataGen].columns[index2].name);
        }

        hasChanged();
    });

    $("#trashDeleteCollumn").on("click", function(){
        deleteCollumn();
    });

    $("#upArrowButton").on("click", function(){
        if (lastCollumnSelected){
            let index = parseInt(lastCollumnSelected.find(".tdIndex").text()) - 1;
            if (index > 0){
                let genTemp = datagen[currentDataGen].columns[index-1];
                datagen[currentDataGen].columns[index-1] = datagen[currentDataGen].columns[index];
                datagen[currentDataGen].columns[index] = genTemp;
                showGenerators();
                hasChanged();

                lastCollumnSelected = $($("#tbody").find(".tdIndex")[index-1]).parent();
                lastCollumnSelected.css("background-color", "cornflowerblue");
            }
        }
    });

    $("#downArrowButton").on("click", function(){
        if (lastCollumnSelected){
            let index = parseInt(lastCollumnSelected.find(".tdIndex").text()) - 1;
            if (index < datagen[currentDataGen].columns.length-1){
                let genTemp = datagen[currentDataGen].columns[index+1];
                datagen[currentDataGen].columns[index+1] = datagen[currentDataGen].columns[index];
                datagen[currentDataGen].columns[index] = genTemp;
                showGenerators();
                hasChanged();

                lastCollumnSelected = $($("#tbody").find(".tdIndex")[index+1]).parent();
                lastCollumnSelected.css("background-color", "cornflowerblue");
            }
        }
    });

    $("#btnPincelGerador").on("click", function(){
        if(activeGenerator[currentDataGen] && (especialPasteState===0 || especialPasteState===3)){
            generatorEspecialPaste = activeGenerator[currentDataGen];
            especialPasteState=1;
            $(this).addClass("active");
            $("#btnPincelMagico").removeClass("active superactive");
        }else if(especialPasteState>0){
            especialPasteState=0;
            $(this).removeClass("active superactive");
        }
    }).on("dblclick", function(){
        if(activeGenerator[currentDataGen] && (especialPasteState===0 || especialPasteState===3)){
            generatorEspecialPaste = activeGenerator[currentDataGen];
            especialPasteState=2;
            $(this).addClass("superactive");
            $("#btnPincelMagico").removeClass("active superactive");
        }else if(especialPasteState>0){
            especialPasteState=0;
            $(this).removeClass("active superactive");
        }
    });

    $("#btnPincelMagico").on("click", function(){
        if(activeGenerator[currentDataGen] && especialPasteState<3){
            generatorEspecialPaste = activeGenerator[currentDataGen];
            especialPasteState=3;
            const buttons =
                [
                    {
                        id:"btn_mp_cancel",
                        color: "negative",
                        name: "Cancel",
                        func: () => {console.log('clicou Cancel')}
                    },
                    {
                        id:"btn_mp_ok",
                        color: "primary",
                        name: "Let go!",
                        func: () => {console.log('clicou Let go!')}
                    }
                ]
            setModalPadrao('Configure Magic Painter', '', "info", buttons);
            $(this).addClass("superactive");
            $("#btnPincelGerador").removeClass("active superactive");
        }else if(especialPasteState>0){
            especialPasteState=0;
            $(this).removeClass("superactive");
        }
    });

    $("#btnDesenho").on("click", function(){
        if(activeGenerator[currentDataGen] instanceof DataGen.superTypes["Geometric"]){
            //TODO: Aqui Yvan!
            let configs = [];
            //if (paths.length === 0){
                //configs.push(activeGenerator[currentDataGen].getModel());
                configs.push({name:'Bezier', path: activeGenerator[currentDataGen].getModel().path});
                console.log(configs);
            /*}else{
                configs = paths;
            }*/
            ipc.send('draw-window', configs);
        }
    });

    $("tr.columTr").keyup(function (event){
        console.log("Teste");
    });

    $("#tableCollumn").on("keyup", "tr.columnTr", function(event){
        console.log(event);
    });

    $("#tableCollumn").on("click", "tr.columnTr", function(){
        if (lastCollumnSelected){
            lastCollumnSelected.css("background-color", lastCollumnSelectedColor)
        }

        lastCollumnSelected = $(this);
        lastCollumnSelectedColor = $(this).css("background-color");

        $(this).css("background-color", "cornflowerblue");
        $('#leftSideBar').empty();
        $('#leftSideBar').append(
            $("<table/>").attr("class","propTable").append(
                $("<tr/>").append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").text("Name ")
                    )
                ).append(
                    $("<td/>").css("padding", "0px").append(
                        $("<input>").addClass("form-control smallInput").attr("id", "collumnName").attr("type", "text").attr("value", $(this).get(0).__node__.name)
                    )
                )
            ).append(
                $("<tr/>").append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").text("Type ")
                    )
                ).append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").text($(this).get(0).__node__.type)
                    )
                )
            ).append(
                $("<tr/>").append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").text("ID ")
                    )
                ).append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").attr("id", "collumnID").text($(this).get(0).__node__.ID)
                    )
                )
            ).append(
                $("<tr/>").append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").text("Display ")
                    )
                ).append(
                    $("<td/>").append(
                        $("<label/>").addClass("tooltip-label").text($(this).get(0).__node__.display)
                    )
                )
            )
        );
    });

    $("#generatorPropertiesForm").on("change", "input,select", function(){
        let $input = $(this);
        if($input.attr("data-type") === "number")
            this.__node__[$input.attr("data-variable")] = parseFloat($input.val());

        else if($input.attr("data-type") === "string")
            this.__node__[$input.attr("data-variable")] = $input.val();

        else if($input.attr("data-type") === "file" && $input.get(0).files[0])
            this.__node__[$input.attr("data-variable")] = $input.get(0).files[0].path.replace(/\\/g,'/');

        else if($input.attr("data-type") === "folder" && $input.get(0).files[0]){
            let files = $input.get(0).files;
            let dataArray = [];
            for (let i=0; i<files.length; i++) {
                let pathName = $input.get(0).files[i].path.replace(/\\/g,'/');
                dataArray.push(pathName);              
            }
            console.log(dataArray);
            this.__node__[$input.attr("data-variable")] = dataArray;
        }
        else if($input.attr("data-type") === "auto")
            this.__node__[$input.attr("data-variable")] = isNaN(parseFloat($input.val())) ? $input.val() : parseFloat($input.val());

        else if($input.attr("data-type") === "options")
            this.__node__[$input.attr("data-variable")] = $input.val();

        else if($input.attr("data-type") === "array")
            this.__node__[$input.attr("data-variable")] = $input.val().split(",");

        else if($input.attr("data-type") === "boolean")
            this.__node__[$input.attr("data-variable")] = $input.get(0).checked;

        else if($input.attr("data-type") === "Generator") {
            console.log("Aqui!!!!!!!!!!", $input.val());
            this.__node__[$input.attr("data-variable")] = datagen[currentDataGen].findGenByID($input.val());
        }

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
        setTimeout(()=>{ showGenerators(); }, 500);
        hasChanged();
        // showGenerators();
    });

    $("#tableCollumn").on("click", "div.md-chip", function(){
        if(especialPasteState>0){
            if(especialPasteState===1) {especialPasteState=0; $("#btnPincelGerador").removeClass("active");}
            let newEspGen = generatorEspecialPaste.copy();
            this.__node__.changeGenerator(newEspGen);
            this.__node__ = newEspGen;
        }
        configGenProps.apply(this,arguments);
        showGenerators();
    });

    $.contextMenu({
        selector: '#selectGeneratorType',
        trigger: 'none',
        callback: function (nameNewGenerator) {
            let newGen = new (DataGen.listOfGens[nameNewGenerator])();
            //substitui o gerador na estrutura.
            this[0].__node__.changeGenerator(newGen);

            activeGenerator[currentDataGen] = newGen;

            let $active_chip = showGenerators();
            configGenProps.apply($active_chip.get(0),[true]);
            datagen[currentDataGen].resetAll();
            hasChanged();
        },
        items: configureMenuOfGens()
    });

    $(".context-menu-item").not(".context-menu-submenu").on("mouseover", function(e){
        try {
            $(this).find("span").attr("title",DataGen.listOfGensHelp[$(this).find("span").text()])
        } catch (e) {
            $(this).find("span").attr("title","There's no tooltip for this yet :(")
        }

    });

    $("#selectGeneratorType").on("click", function(e){
        e.preventDefault();
        $(this).contextMenu();
    }).on("mousedown",(e)=>{
        e.preventDefault();
    });

    $("#rowsQtInput").blur(function(){
        $(".tooltiptext").css("visibility", "hidden").css("opacity", 0);
    });

    $("#btnConfigGeneration").click(function(){
        configGeneration()
    });

    $("#tableCollumn").on("click", "span.btnRemoveGen", function(){
        let md_chips = $(this).parent().children("div.md-chip");
        if (md_chips.length > 1){
            let generators = [];
            if(generators.includes(activeGenerator[currentDataGen])){
                activeGenerator[currentDataGen].unlink();
                activeGenerator[currentDataGen] = undefined;
            } else {
                let l = md_chips.length-2;
                md_chips.get(l).__node__.removeLastGenerator();
            }
            showGenerators();
        }
        hasChanged();
    }).on("click", "span.btnAddGen", function(){
        let md_chips = $(this).parent().children("div.md-chip");
        let l = md_chips.length-1;
        md_chips.get(l).__node__.addGenerator(new UniformGenerator());

        let generators = [];
        datagen[currentDataGen].columns[$(this).parent().parent().index()].generator.getFullGenerator(generators);
        activeGenerator[currentDataGen] = generators[generators.length-1];
        showGenerators();

        let coluna = $(this).closest(".columnTr").get(0).__node__;
        propsConfigs(generators[generators.length-1],coluna);
        hasChanged();

    }).on("click", "span.btnRemoveColumn", function(){
        datagen[currentDataGen].removeColumn(parseInt($(this).parent().parent().find(".tdIndex").text()) - 1);
        $(this).parent().parent().find(".columnGen").children().each(function() {
            if($(this).hasClass("active-md-chip")) {
                $('#selectGeneratorType').empty().attr("disabled", true);
                $('#generatorPropertiesForm').empty();
            }
        });
        showGenerators();
        hasChanged();

    }).on("click", "span.btnFilter", function(){
        //Get the selected dimension.
        let colu = datagen[currentDataGen].columns[parseInt($(this).parent().parent().find(".tdIndex").text()) - 1];
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
        let col = $(this).parent().parent().get(0).__node__;
        let i = collumnsSelected.indexOf(col);
        if ($(this).is(':checked')){
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
        if (e.keyCode === 67 && e.ctrlKey) {// CRTL + C
            collumnsCopied = [];
            for (let i = collumnsSelected.length-1; i >= 0; i--){
                collumnsCopied.push(collumnsSelected[i]);
            }
        }
    });

    $(document).keydown(function(e) {
        if (e.keyCode === 86 && e.ctrlKey) {// CRTL + V
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
                datagen[currentDataGen].addColumn(newName, collumnsCopied[i].generator.copy());
            }
            collumnsSelected = [];
            showGenerators();
            hasChanged();
        }
    });

    dragAndDropGens();
    $("#windowModalPadrao").click( () => {
        $("#windowModalPadrao").hide();
    })
    $("#windowModalPadrao-box").click( (event) => { event.stopPropagation();})
});

function setModalPadrao(title, content, style="", buttons=[]) {
    const modalTitle = document.getElementById("windowModalPadrao-title");
    const modalContent = document.getElementById("windowModalPadrao-content");
    const modalFooter = document.getElementById("windowModalPadrao-footer");

    if(style) {
        modalTitle.classList.add(`title-modal-${style}`)
    }
    let setFooter = "";
    for (const button of buttons) {
        setFooter += `<button id="${button.id}" class="btn btn-${button.color}">${button.name}</button>`;
        $(`#windowModalPadrao-footer`).on('click', `#${button.id}`, () => {
            if(style) {
                modalTitle.classList.remove(`title-modal-${style}`)
            }
            button.func();
        });
    }
    modalTitle.innerText = title;
    modalContent.innerHTML = `<p>${content}</p>`;
    modalFooter.innerHTML = setFooter;

    $("#windowModalPadrao").show();

}

function deleteCollumn(){
    if (lastCollumnSelected){
        datagen[currentDataGen].removeColumn(parseInt(lastCollumnSelected.find(".tdIndex").text()) - 1);
        lastCollumnSelected = null;
        showGenerators();
        hasChanged();
    }
}

async function verifyBackupModels() {
    if(!await access(platformASpath)) throw new Error("No Files")
    let files = await readDir(platformASpath);
    // if(files.length === 0) throw new Error("No Files")
    try {
        for (let nextFile of files) {
            await openModel(platformASpath+nextFile, true);
            await del(platformASpath+nextFile);
        }
        return true

    } catch (e) {
        console.log(e)
        if(e.message.includes("Real Data Wrapper is strange!")) return true
        throw new Error("Something Bad Happened")
    }
}

let modal = document.getElementById('myModal');

// =========== Data Generation ==================
function generateDatas(){
    if(generating) {
        setModalPadrao('Error!', 'The system is already generating!', "error");
        return;
    }
    try {
        modal.style.display = "block";
        let saveas = datagen[currentDataGen].save_as;

        let saveScreen = new BrowserWindow({show: false, alwaysOnTop: true});
        if(process.platform === "darwin") {saveScreen.show(); saveScreen.maximize(); saveScreen.focus();}
        
        dialog.showSaveDialog(saveScreen,{
            title: "Save Data",
            filters: [{name: saveas, extensions: [saveas]}]
        }).then((result) => {
            if(result.canceled)
                return;

            let targetPath = result.filePath; 
            saveScreen.close();
            modal.style.display = "none";
            if (targetPath) {
                
                if(path.dirname(targetPath) == "/") {
                    setModalPadrao('Error!', 'Invalid Directory!', "error");
                    $("#percentageGDMessage").text("Error!");
                    return ;
                }
                generating = true
                stopGeneration = false; //Não impedir que a geração pare quando usuário tenha parado por algum erro.
                $("#percentageGDMessage").text("Starting...");
                $("#percentageCancelIcon").css("display", `block`);
                if (datagen[currentDataGen].configs.iterator.hasIt) {
                    generateDataIt(targetPath)
                } else {
                    dataGeneration(targetPath)
                        .then( () => {
                            $("#percentageGDMessage").text("Finished!");
                            $("#percentageGDBar").css("display", `none`);
                            $("#percentageCancelIcon").css("display", `none`);
                            setModalPadrao('Success!', 'Data Saved!', "success");
                            generating = false
                        }).catch((err) => {
                            catchs(err.message)
                            generating = false
                        })
                }
            }
        })


    }catch (e) {
        console.log(e);
        setModalPadrao('Error!', 'Some problem happened!!! Verify generators properties.\n' +
        'Tips:\n' +
        '     * Be sure that Input Property of Function Generators isn\'t null ', "error");

        modal.style.display = "none";
    }
}

function catchs(message) {
    switch (message) {
        case 'abort':
            if(itFiles.length === 0)
                stopGeneration = false;
            setModalPadrao('Success!', 'The data generation was aborted succefully!', "success");
            $("#percentageGDMessage").text("Aborted!");
            $("#percentageGDBar").css("display", "none");
            $("#percentageCancelIcon").css("display", `none`);
            break;
        default:
            console.trace(message)
            setModalPadrao('Error!', 'Something bad happened!', "error");
            $("#percentageCancelIcon").css("display", `none`);
            $("#percentageGDMessage").text("Failed!");
            $("#percentageGDBar").css("display", "none");
            break;
    }
}

async function generateDataIt(targetPath) {
    // TODO: colocar configs no exportModel e Importmodel.
    let it = datagen[currentDataGen].configs.iterator;
    let prevValue = it.generator[it.parameterIt];
    it.generator[it.parameterIt] = it.beginIt;
    // if(datagen[currentDataGen].n_lines > 10000 || (datagen[currentDataGen].n_lines > 5000 && datagen[currentDataGen].columns.length>30)) {

    $("#percentageCancelIcon").css("display","block");
    let files = [];
    for(let i = 0; i < datagen[currentDataGen].configs.iterator.numberIt; i++) {
        const curPath = targetPath.replace(
            /(.*)(\.\w+)$/g,
            (match, p1, p2) => {
                return p1 + "[" + i + "]" + p2;
            }
        )
        itFiles.push(curPath);
        files.push(dataGeneration(curPath))
        datagen[currentDataGen].configs.iterator.generator[datagen[currentDataGen].configs.iterator.parameterIt] 
        += 
        datagen[currentDataGen].configs.iterator.stepIt;
    }
    Promise.all(files)
        .then(() => {
            $("#percentageCancelIcon").css("display","none");
            $("#percentageGDMessage").text("Finished!");
            $("#percentageGDBar").css("display", `none`);
            datagen[currentDataGen].configs.iterator.generator[datagen[currentDataGen].configs.iterator.parameterIt] = prevValue;
            setModalPadrao('Success!', 'All Files Saved!', "success");
            generating = false
            itFiles = [];
        })
        .catch( (err) => {
            catchs(err.message);
            generating = false
        });
}

$("#percentageCancelIcon").click(function(e){
    setModalPadrao('Tell me please!', 'You going to abort the writing. What do you want to do about the file(s)?', "info", [
        {
            name: "Discard",
            color: "negative",
            id: "discart",
            func: function () {
                stopGeneration = "discart"
                $("#percentageCancelIcon").css("display","none");
                $("#windowModalPadrao").hide()
            }
        },
        {
            name: "Keep",
            color: "primary",
            id: "keep",
            func: function () {
                stopGeneration = "keep";
                $("#percentageCancelIcon").css("display","none");
                $("#windowModalPadrao").hide()
            }
        }
    ]);
});

async function displayMessage(file, value) {
    let index = false;
    if(datagen[currentDataGen].configs.iterator.hasIt) {
        index = file.slice(file.indexOf("[")+1,file.indexOf("]"));
    }
    $("#percentageGDBar").css("display", `block`);
    $("#percentageGDprogressBar").css("width", `${Math.fround(value*100)}%`)
    $("#percentageGDlabelBar").text(`${Math.round(value*10000)/100}%`)
    try {
        const fileStats = await stats(file);
        const usedSpace = fileStats.size;
        $("#percentageGDMessage").text(
            `${index ? `[${index}]` : ""} Cur: ${sizeFormatter(usedSpace, true)} 
            \n~Total: ${sizeFormatter(usedSpace/value, true)}`
        );
    } catch(e) {}
}

async function dataGeneration(targetPath) {
    try {
        const dt = _.cloneDeep(datagen[currentDataGen])
        switch(dt.save_as) {
            case 'json':
                await writeFile(
                    targetPath,
                    JSON.stringify(
                        dt.generate(dt.n_lines)
                    )
                        .slice(0, dt.n_lines > dt.step_lines ? -1 : undefined),
                    "utf8"
                )
                if(dt.n_lines > dt.step_lines) {
                    for(let i = dt.step_lines; i < dt.n_lines; i+=dt.step_lines) {
                        if(stopGeneration !== false) {
                            if(stopGeneration === "discart") {
                                if(itFiles.length !== 0) itFiles.pop();
                                if(await exist(targetPath))
                                    await del(targetPath);
                            } else if(stopGeneration === "keep") {
                                await appendFile(targetPath, "]", "utf8");
                            }
                            if(itFiles.length === 0) 
                                throw new Error('abort');
                        }
                        await appendFile(targetPath, ",", "utf8");
                        await appendFile(
                            targetPath,
                            JSON.stringify(
                                dt.generate(dt.n_lines)
                            ).slice(1, -1),
                            "utf8");
                        displayMessage(targetPath, i/dt.n_lines)
                    }
                    await appendFile(targetPath, "]", "utf8");
                    await displayMessage(targetPath, 1);
                }
                break;
            case 'csv':
            case 'tsv':
                const parser = new Json2csvParser (
                    {
                        fields: dt.getDisplayedColumnsNames(),
                        delimiter: 
                            dt.save_as === 'csv' ? ',' : '\t'
                    }
                );
                const csv = parser.parse(dt.generate(dt.n_lines));  
                await writeFile(targetPath, csv, "utf8");
                if(dt.n_lines > dt.step_lines) {
                    const appendParser = new Json2csvParser (
                        {
                            header: false,
                            delimiter: 
                                dt.save_as === 'csv' ? ',' : '\t'
                        }
                    );
                    for(let i = dt.step_lines; i < dt.n_lines; i+=dt.step_lines) {
                        if(stopGeneration !== false) {
                            if(stopGeneration === "discart") {
                                await del(targetPath);
                                if(itFiles.length !== 0) itFiles.pop();
                            }
                            if(itFiles.length === 0)
                                throw new Error('abort')
                            return;
                        }
                        const apcsv = appendParser.parse(dt.generate(dt.n_lines-i));
                        await appendFile(targetPath, "\n", "utf8");
                        await appendFile(targetPath, apcsv, "utf8");
                        displayMessage(targetPath, i/dt.n_lines)
                    }
                    await displayMessage(targetPath, 1);
                }
                break;
        }
    } catch (e) {
        throw e;
    }
}

function sizeFormatter(size, hasUnit) {
    if(Number(size)<1024) {
        size = String(size).substr(0,6);
        if(hasUnit) size += " B";
    } else if(Number(size)<1024*1024) {
        size = String(size/(1024)).substr(0,6);
        if(hasUnit) size += " KB";
    } else if(Number(size)<1024*1024*1024) {
        size = String(size/(1024*1024)).substr(0,6);
        if(hasUnit) size += " MB";
    } else if(Number(size)<1024*1024*1024*1024) {
        size = String(size/(1024*1024*1024)).substr(0,6);
        if(hasUnit) size += " GB";
    } else {
        size = size/(1024*1024*1024*1024);
        if(hasUnit) size += " TB";
    }
    return size;
}
// ========== End Data Generation ===============

// ========== Distribuited System ===============

async function createServerSocket() {

    //TODO: Mostrar no progressBar que o há um server ativo [S]

    if(generating) {
        setModalPadrao("Error!", "You already have a generation running!", "error!")
        return;
    }

    if(distributedSystemSocket !== undefined) {
        if(distributedSystemSocket.hasOwnProperty("_slaves")) { //close server
            //TODO: Are You Sure...
            distributedSystemSocket.close()
            setModalPadrao("Success!", "You close the Server successfully!", "success")
        } else {
            setModalPadrao("Error!", "You have a Client Distributed System running.", "error")
        }
        return
    }

    let clients = {};

    const model = datagen[currentDataGen].exportModel();
    const {dsPort} = datagen[currentDataGen]
    const ds_datagen = new DataGen()

    ds_datagen.columns = []
    ds_datagen.importModel(model)

    clients["id"] = ds_datagen.ID

    const chunksNumber = ds_datagen.n_lines/ds_datagen.n_sample_lines
    let chunksCounter = 0
    
    distributedSystemSocket = net.createServer(function (socket) {
    
        const name = socket.remoteAddress + ":" + socket.remotePort 
    
        if(!client.hasOwnProperty(name))
            clients[name] = socket;
    
        socket.on('data', function (data) {
            jdata = JSON.parse(data)
            if(!jdata.hasOwnProperty("code")) return 
            const code = jdata['code'];
            let chunk;

            switch(code) {
                case 1:
                    clients[name]["sentChunk"] = [];
                    clients[name]["receivedChunk"] = [];
    
                    chunk = getChunkInteration();
    
                    if(!!chunk) {
                        socket.write(JSON.stringify({code: 5}));
                        server.close();
                    } else {
                        clients[name]["sentChunk"].push(chunk);
    
                        socket.write(JSON.stringify(
                            {
                                code: 2,
                                "ID": ds_datagen.ID,
                                "model": model,
                                "chunk": chunk
                            }
                        ))
                    }
                    break;
                case 4: //TODO: receber o chunk e salvar que este foi concluído com sucesso.
                    clients[name]["receivedChunk"].push(jdata["chunk"]);
                    chunk = getChunkInteration();
    
                    if(!!chunk) {
                        socket.write(JSON.stringify({code: 5}));
                        server.close();
                    } else {
                        clients[name]["chunks"].push(chunk);
    
                        socket.write(JSON.stringify(
                            {
                                code: 3,
                                "chunk": chunk
                            }
                        ));
                    }
                    break;
                case 7:
                    //TODO: Verificar formas de recuperação dos arquivos.
                    break;
            }
        });
    
    }).listen(dsPort);

    // Enviar clients para mostrar ao usuário e criar json.

    function getChunkInteration() {
        if (chunksCounter === chunksNumber)
            return true // codigo 5
        
        chunksCounter++
        return chunksCounter
    }
}

async function createClientSocket() {

    //TODO: Mostrar no progressBar que o há um cliente ativo [C]

    if(generating) {
        setModalPadrao("Error!", "You already have a generation running!", "error!")
        return;
    }

    if(distributedSystemSocket !== undefined) {
        if(!distributedSystemSocket.hasOwnProperty("_slaves")) { //close client
            //TODO: Are You Sure...
            closeConnection()
            setModalPadrao("Success!", "You close the Client connection successfully!", "success")
        } else {
            setModalPadrao("Error!", "You have a Server Distributed System running.", "error")
        }
        return
    }

    const ipAddress = datagen[currentDataGen]["dsIpAddress"];
    const port = datagen[currentDataGen]["dsPort"];

    const clientLog = {
        server: `${ipAddress}_${port}`,
        chunks: []
    };

    let model = new DataGen();
    model.columns = [];

    let pathToChunks = "";
    
    distributedSystemSocket = new net.Socket(); // TODO: tornar global para melhor controle. Associar à variável generating!

    try {
        distributedSystemSocket.connect(port, ipAddress, function (err) {
            if(err) 
                throw err;
    
            distributedSystemSocket.write(JSON.stringify({
                "code" : 1,
                "username": username
            }));
        });

        distributedSystemSocket.on("error", function(e) {
            if(e.message.includes("ECONNREFUSED")) {
                console.error("was not possible to connect");
                setModalPadrao("Error!", "It was not possible to connect. Please, verify the Ip Address and Port if those are correct.", "error");
            } else {
                throw e;
            }
            closeConnection();
        });
        
        distributedSystemSocket.on('data', async function (data) {
            jdata = JSON.parse(data)
            if(!jdata.hasOwnProperty("code")) return 
            const code = jdata['code'];
        
            switch(code) {
                case 2:
                    model.importModel(jdata['model'])
                    pathToChunks = path.join(tmpDir, jdata['id'])
    
                    if(!await access(pathToChunks))
                        await mk(pathToChunks)
                    
                    try{
                        await dd_generate(jdata['chunk'])
                        clientLog['chunks'].push(jdata['chunk'])
                        distributedSystemSocket.write(JSON.stringify({"code": 4, "chunk": jdata['chunk']}))
                    } catch(e) {
                        console.log(e)
                        console.error("Failed to generate chunk "+jdata['chunk'])
                    }
                    break;
                case 3:
                    try{
                        await dd_generate(jdata['chunk'])
                        clientLog['chunks'].push(jdata['chunk'])
                        distributedSystemSocket.write(JSON.stringify({"code": 4, "chunk": jdata['chunk']}))
                    } catch(e) {
                        console.log(e)
                        console.error("Failed to generate chunk "+jdata['chunk'])
                    }
                    break;
                case 5:
                    // Encerrar client
                    closeConnection()
                    break;
                case 6:
                    //TODO: Verificar formas de recuperação dos arquivos.
                    break;
            }
        });
    
        distributedSystemSocket.on('close', function() {
            //TODO: Avisar que o servidor caiu.
            //Escrever no progress bar
            closeConnection()
            console.log('DS Connection closed');
        });
        
        async function dd_generate(chunk) {
            // TODO: Verificar cada coluna e modificar o begin de cada gerador sequencial.
            const targetPath = path.join(pathToChunks, `${chunk}.${model.save_as}`)
            switch(model.save_as) {
                case 'json':
                    await writeFile(
                        targetPath,
                        JSON.stringify(
                            model.generate(model.step_lines)
                        ),
                        "utf8"
                    )
                    break;
                case 'csv':
                case 'tsv':
                    const parser = new Json2csvParser (
                        {
                            fields: model.getDisplayedColumnsNames(),
                            header: chunk > 0 ? false : true,
                            delimiter: 
                                model.save_as === 'csv' ? ',' : '\t'
                        }
                    );
                    const csv = parser.parse(model.generate(model.step_lines));  
                    await writeFile(targetPath, csv, "utf8");
                    break;
            }
        }

        function closeConnection() {
            distributedSystemSocket.destroy()
            distributedSystemSocket = undefined
        }
    }
    catch(e) {
        console.error(e)
        //avisar ao cliente
        return
    }
}

function addGenerator(){
    datagen[currentDataGen].addColumn("Dimension "+(++datagen[currentDataGen].columnsCounter));
    showGenerators();
    hasChanged();
}

function dragGenerator(evt){
    let params = evt.target.__node__.getGenParams();
    let genID = evt.target.__node__.ID;
    let genModel = evt.target.__node__.getModel();
    let modelID = datagen[currentDataGen].ID;
    let modelName = datagen[currentDataGen].name;
    let col = $(evt.target).closest(".columnTr").get(0).__node__;
    let colName = col.name;
    let colID = col.ID;
    evt.dataTransfer.setData("text/plain", JSON.stringify({modelID, modelName, colID, colName, genID, genModel, params}));
}

function dragAndDropGens(){
    let dragged = {};
    $(".md-chip").on("drop",function(event){
        event.preventDefault();
        event.stopPropagation();
        $("#iconDown").css({display: "none"});

        // console.log(event.target.getBoundingClientRect(), event);

        if(dragged !== event.target.__node__){
            let bouding = event.target.getBoundingClientRect();
            let midTarget = Math.round(bouding.left+bouding.width/2);

            dragged.unlink();
            if((midTarget - event.pageX) < 0)
                event.target.__node__.insertGenerator(dragged);
            else
                event.target.__node__.insertGeneratorBefore(dragged);
        }

        showGenerators();
    }).on("dragover", function(event) {
        event.preventDefault();
        event.stopPropagation();
        if(event.target.__node__ && event.target.__node__ instanceof DataGen.superTypes.Generator){
            let bouding = event.target.getBoundingClientRect();
            let midTarget = Math.round(bouding.left+bouding.width/2);
            let left = bouding.left-8;
            let top = bouding.top-14;
            if((midTarget - event.pageX) < 0)
                left+=bouding.width;
            $("#iconDown").css({
                left: left+"px",
                top: top+"px",
                display: "block"
            });
        }
    }).on("dragleave", function(event) {
        event.preventDefault();
        event.stopPropagation();
        $("#iconDown").css({display: "none"});
    }).on("dragstart", function(event){
        event.stopPropagation();
        dragged = event.target.__node__;
    });
}
let waitChanges;
function hasChanged() { //permite o Auto Save.
    clearTimeout(waitChanges);
    datagen[currentDataGen].datagenChange = true;
    datagen[currentDataGen].saveState();
    reloadModelsIcon();
    waitChanges = setTimeout(function(){ autoSaveBackupFile() }, 1000);
}

/*Desenha na tela principal as colunas e seus respectivos geradores baseados nos dados armazendos no array datagen*/
function showGenerators() {
    let active_gen_chip = {};
    function displayGens($tdGen, generator){
        let generators = [];
        generator.getFullGenerator(generators);

        for(let gen of generators){
            if (gen instanceof DataGen.superTypes.SwitchCaseFunction){
                let $switchGenTable = $("<table/>");
                let $chip = $("<div/>").addClass("md-chip md-chip-hover")
                    .text(gen.order + "-" + gen.name)
                    .attr("draggable","true");

                $chip.get(0).ondragstart = dragGenerator;
                if(gen === activeGenerator[currentDataGen])
                    active_gen_chip.obj = $chip.addClass("active-md-chip");

                $chip.get(0).__node__ = gen;
                $tdGen.append($chip);

                let $switchGenTr;
                // let flag = false;
                let listOfGenSF = gen.listOfGenerators;
                for (let c in listOfGenSF){
                    if(listOfGenSF.hasOwnProperty(c)){
                        $switchGenTr = $("<tr/>");
                        // if (!flag){
                        //     $switchGenTr.append($("<td/>").attr("rowspan", Object.keys(listOfGenSF).length).append($chip));
                        //     flag = true;
                        // }
                        $switchGenTr.append($("<td/>").text(c));
                        let $td = $("<td/>").addClass("columnGen");

                        displayGens($td, listOfGenSF[c], active_gen_chip);
                        $switchGenTr.append($td);
                        $switchGenTable.append($switchGenTr);
                    }
                }
                $tdGen.append($("<div/>").css("display","inline-block").append($switchGenTable));
                // break;
            }else{
                let $chip = $("<div/>").addClass("md-chip md-chip-hover")
                    .text(gen.order + "-" + gen.name)
                    .attr("draggable","true");
                $chip.get(0).ondragstart = dragGenerator;
                if(gen === activeGenerator[currentDataGen])
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

    
    let $tbody = $("#tbody").empty();
    if (datagen.length > 0){
        for(let i = 0; i < datagen[currentDataGen].columns.length; i++){
            let $tr = $("<tr/>").addClass("columnTr");
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
            displayGens($tdGen, datagen[currentDataGen].columns[i].generator);

            $tr.append($tdGen);

            let slash = datagen[currentDataGen].columns[i].display == false ? "-slash": "";

            $tr.get(0).__node__ = datagen[currentDataGen].columns[i];

            $tr.append($("<td/>").append($("<span/>").addClass("btnGenerator btnFilter fa fa-filter"+slash+" fa-lg")));
            $tr.append($("<td/>").append($("<span/>").addClass("btnGenerator btnRemoveColumn icon icon-trash")));
        }

        dragAndDropGens();
    }
    optionsPreview();
    redrawPreview();

    if(activeGenerator[currentDataGen] instanceof DataGen.superTypes.Geometric)
        $("#btnDesenho").removeAttr("disabled");
    else
        $("#btnDesenho").attr("disabled", "true");

    return active_gen_chip.obj;
}

function redrawPreview(){
    try{
        current_sample = datagen[currentDataGen].generateSample();
        preview(current_sample);
        ipc.send('change-datasample', current_sample);
    }catch (e){

        switch (e) {
            case 'Please, insert a sentence.':
                setModalPadrao('Error!', "Please, insert a sentence.", "error");
        }
        console.log(e);

    }
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

    // if(activeGenerator[currentDataGen] == generator && arguments[0] !== true) {
    //     $('#selectGeneratorType').empty().attr("disabled", true);
    //     $('#generatorPropertiesForm').empty();
    //     activeGenerator[currentDataGen] = undefined;
    //     $(this).removeClass("active-md-chip");
    //     showModels();
    //     showGenerators();
    // } else {
    //     activeGenerator[currentDataGen] = generator;
    //     let coluna = $(this).closest(".columnTr").get(0).__node__;
    //     propsConfigs(generator,coluna)
    // }

    activeGenerator[currentDataGen] = generator;
    let coluna = $(this).closest(".columnTr").get(0).__node__;
    propsConfigs(generator,coluna)

}

function reloadModelsIcon () {
    //WebService
    $(".fa-upload").css("visibility","hidden");
    if(Object.keys(WSMA).length !== 0) {
        for(let item in WSMA) {
            if(WSMA[item][0]) {
                $(".fa-upload").eq(WSMA[item][1]).css("visibility","visible");
            }
        }
    }

    //Model Change Icon
    $(".fa-circle").css("visibility","hidden");
    for(let i in datagen) {
        if(datagen[i].datagenChange) {
            $(".fa-circle").eq(i).css("visibility","visible");
        }
    }
}

function renameModel(i=currentDataGen) {

    const id = datagen[i].ID.toLowerCase().replace("_", "").replace(".","")
    let title = $(`#${id}`).text();
    console.log(id)
    console.log(title)
    $(`#${id}`).empty();
    $(`#${id}`).append($("<input/>").attr("type", "text").blur(function(){
        const name = $(this).val();

        if(!name || name === datagen[i].name) return showModels()
        
        datagen[i].name = $(this).val();
        showModels();
        hasChanged();
    }))
    $(`#${id}`).find("input").focus()
    $(`#${id}`).find("input").val(title)

}

function deleteModel(indexDatagen=currentDataGen) {
    if((isNaN(indexDatagen) || !isFinite(indexDatagen))) return;
    if(!datagen[indexDatagen].datagenChange) {closeTab(indexDatagen); return;}
    const options = {
        type: 'question',
        buttons: ['Cancel', 'Yes', 'No'],
        defaultId: 0,
        title: 'Save',
        message: 'Save file "'+ datagen[indexDatagen].name +'"?',
        checkboxChecked: false,
    };

    dialog.showMessageBox(null, options).then(({response}) => {
        if (response === 1){
            try {save("save", indexDatagen)} catch(e) {console.error(e)}
        }
        if(response !== 0) closeTab(indexDatagen);
    });

    async function closeTab(index){
        //let index = datagen.indexOf($(this).parent().get(0).__node__);
        if (index < 0) return;

        if(platformASpath !== false) {
            const inPath = `${platformASpath}${datagen[index].ID}.json`
            if(await access(inPath)) {
                await del(inPath);
            }
        }

        datagen.splice(index, 1);
        if (index === currentDataGen)
            currentDataGen = (index === 0) ? 0 : (index - 1);
        else if (index < currentDataGen)
            currentDataGen--;
        showModels();
        showGenerators();
    }
}

function exportModelDot(datastr=datagen[currentDataGen].exportDot()) {

    dialog.showSaveDialog({
        title:"Save Data", 
        filters:[{name:"Graph",extensions:["dot"]}]
    }).then(({canceled, filePath}) => {
        if(!canceled){
            fs.writeFile(filePath, datastr, (err) => {
                if (err) throw err;
            });
        }
    });
}

function CopyModelId(i=currentDataGen) {

    const varModelID = datagen[i].ID;
    if(process.platform === 'darwin') {
        clipboard.writeText(varModelID,'selection');
    }else {
        clipboard.writeText(varModelID);
    }
}

function toggleWS(i=currentDataGen) {

    let htmlItem = $(".fa-upload").eq(i);
    const varModelID = datagen[i].ID;
    if(!(varModelID in WSMA)) {
        WSMA[varModelID] = [true,i];
        htmlItem.css("visibility","visible");
    }
    else if(WSMA[varModelID][0]) {
        WSMA[varModelID] = [false,i];
        htmlItem.css("visibility","hidden");
    } else {
        WSMA[varModelID] = [true,i];
        htmlItem.css("visibility","visible");
    }
    if(!wsActive) {
        wsActive = true;
        createServer();
        changePort(wsPort);
    }
}

function openWS(i=currentDataGen) {

    let htmlItem = $(".fa-upload").eq(i);
    const varModelID = datagen[i].ID;
    if(!(varModelID in WSMA)) {
        WSMA[varModelID] = [true,i];
        htmlItem.css("visibility","visible");
    }
    if(!wsActive) {
        wsActive = true;
        createServer();
        changePort(wsPort);
    }
    //TODO: verificar se vai dá erro trocar essa linha comentada de cima pela de baixo.
    // require("electron").shell.openExternal(`http://localhost:${wsPort}/?modelid=${datagen[i].ID}&nsample=${datagen[i].n_lines}&format=${datagen[i].save_as}`);
    electron.shell.openExternal(`http://localhost:${wsPort}/?modelid=${datagen[i].ID}&nsample=${datagen[i].n_lines}&format=${datagen[i].save_as}`);
}

function uriWS(i=currentDataGen) {

    if(process.platform === 'darwin') {
        clipboard.writeText(`http://localhost:${wsPort}/?modelid=${datagen[i].ID}&nsample=${datagen[i].n_lines}&format=${datagen[i].save_as}`,'selection');
    }else {
        clipboard.writeText(`http://localhost:${wsPort}/?modelid=${datagen[i].ID}&nsample=${datagen[i].n_lines}&format=${datagen[i].save_as}`);
    }
}

function configGeneration() {
    
    let configs = datagen[currentDataGen].configs;
    configs.modelid = datagen[currentDataGen].ID;
    configs.modelName = datagen[currentDataGen].name;
    configs.wsActive = wsActive;
    configs.wsPort = wsPort;
    configs.dsIpAddress = datagen[currentDataGen].dsIpAddress
    configs.dsPort = datagen[currentDataGen].dsPort
    ipc.send('open-config-datagen-window', configs);
}

function showModels(){
    $("#tabs").empty();

    for(let i = 0; i < datagen.length; i++){
        let idNameModel = datagen[i].ID.toLowerCase().replace("_", "").replace(".","");

        let tabButton = $("<li/>").attr('id', idNameModel).text(datagen[i].name).append(
            $("<span/>").addClass("icon")).append(
                $("<span/>").addClass("fa fa-upload")
        ).append(
                $("<span/>").addClass("fa fa-circle")
        ).append(
            $("<span/>").addClass("icon icon-cancel-circled")
        );

        tabButton.addClass("tabButton");
        tabButton.get(0).__node__ = datagen[i];

        tabButton.on("mouseup", "span.icon-cancel-circled", function (event) {
            event.stopPropagation();
            deleteModel(i);
        });

        if (currentDataGen === i){
            tabButton.addClass("selected");
        }

        tabButton.mouseup(function(e) {
            switch (event.which) {
                case 1:
                    if (currentDataGen !== i){
                        currentDataGen = i;
                        $("#leftSideBar").empty();
                        $("#tabs").children().removeClass('selected');
                        $(this).addClass("selected");
                        $('#selectGeneratorType').empty().attr("disabled", true);
                        $('#generatorPropertiesForm').empty();

                        if(activeGenerator[currentDataGen]) propsConfigs(activeGenerator[currentDataGen],activeGenerator[currentDataGen].getRootGenerator().parent);
                        showGenerators();
                    }
                    break;
                case 2:
                    console.log('Middle Mouse button pressed on ' + $(this).text());
                    deleteModel(i);
                    break;
                case 3:
                    //ipc.send('context-menu-datamodel', {x: e.pageX, y: e.pageY, m: i});
                    break;
                default:
                    console.log('You have a strange Mouse!');
            }
        });

        tabButton.get(0).__node__ = datagen[i];
        $("#tabs").append(tabButton);
    }

    let tabPlus = $("<li/>").attr('id', '+').text('+').click(function(){createNewModel ();});
    $("#tabs").append(tabPlus);
    reloadModelsIcon();
}

function createNewModel () {
    datagen.push(new DataGen());

    currentDataGen = datagen.length-1;
    let name = datagen[currentDataGen].name + " " + datagen.length;
    datagen[currentDataGen].name = name

    $("#leftSideBar").empty();
    $('#selectGeneratorType').empty().attr("disabled", true);
    $('#generatorPropertiesForm').empty();
    lastCollumnSelected = null;
    showModels();
    showGenerators();
}

async function createExportModel (path,dtIndex) {
    let index = dtIndex;
    if(dtIndex === undefined) index = currentDataGen;
    try {
        await writeFile(path, datagen[index].exportModel());

    } catch(e) {
        console.log(e);
        throw new Error(e);
    }
}

//Verifica a cada minuto se é preciso salvar automaticamente.
async function autoSaveBackupFile() {
    for(let dt in datagen) {
        if(!datagen[dt].filePath) continue;
        await createExportModel(`${platformASpath}${datagen[dt].ID}.json`, dt);
    }
}

function createImportModel (modelName, data) {

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

    dialog.showSaveDialog({
        title:"Save Generated DataSet", filters:[filt]
    }).then(({canceled, filePath}) => {
        if(!canceled){
            let partsOfStr = filePath.split('\\');
            let targetPath = "";
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

    dialog.showSaveDialog({
        title:"Save Generated DataSet", 
        filters:[{name: 'JSON', extensions:['json']}]
    }).then(({canceled, filePath}) => {
        if(!canceled){
            let partsOfStr = filePath.split('\\');
            let targetPath = "";
            for (let i = 0; i < partsOfStr.length; i++) {
                targetPath += partsOfStr[i] + "\\\\";
            }
            fs.writeFile(targetPath, myJSON, (err) => {
                if (err) throw err;
            });
        }
    });
}

function createModelFromDataSet(path) {

    console.log(path);

    fs.readFile(path, "utf-8", (err, strdata) => {
        if(err){
            setModalPadrao('Error!', "Failed to load the dataSet. Verify if it is UTF-8 encoded.", "error");
            return;
        }
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
                const delimiter = lines[0].indexOf(',') === -1 ? ';' : ','
                for(let i=0;i<lines.length;i++){
                    lines[i] = lines[i].split(path.endsWith(".csv") ? delimiter : "\t");
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
                createdDatagen.addColumn(c, new DataGen.listOfGensComplete['Real Data Wrapper'](data.map(d=>d[c])));
            }

            showModels();
            showGenerators();
    })
}

$("body").on("change", "#input_genType, #input_accessColumnType", () => {
    propsConfigs(activeGenerator[currentDataGen], activeGenerator[currentDataGen].getRootGenerator().parent)
})

//Redraw the options on preview's comboBox.
function optionsPreview() {

    let $combox = $("#comboBoxPreview").empty();


    let cdatagen = datagen[currentDataGen];
    if(!(cdatagen.getColumnsNames()
            .indexOf(selectColumnPreview) >= 0)) {
        selectColumnPreview = cdatagen.columns[0].name;
    }
    for(let col of cdatagen.columns) {
        if(col.display)
            $combox.append($('<option>', {value:col.name, text:col.name}));
    }
    $combox.val(selectColumnPreview);
}

let selectColumnPreview = "Dimension 1"; //Inicialize according the first columns's name.

$('#comboBoxPreview').change(() => {
    selectColumnPreview = $("#comboBoxPreview").val();
    redrawPreview();
});

function preview(data2){
    if(!vis) return;
    if(pc === undefined) {
        pc = new vis["ParallelCoordinates"]($("#previewCanvas").get(0));
    }

    //Set the data into ParallelCoordinates, so it is able to appear on preview.
    pc.data(data2);
    pc.redraw();

    let scaleFunction;
    let range; //range of colors.

    //optionsPreview(); //Call the function for a comboBox options redrawing.

    //Set configs according to the dimension type.
    for(let col of datagen[currentDataGen].columns) {
        if(col.name == selectColumnPreview) {
            console.log("TODO: Adicionar um scale para o tempo na visualização.", col.type)
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
    pc.on("dimensiontitleclick", function (d) {
        selectColumnPreview = d;
        $("#comboBoxPreview").val(d)
        redrawPreview();
    })

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
//TODO: Refatorar lista de supertipos, deixar essa lista somente dentro do datagen.js 
function configureMenuOfGens(){
    let types = DataGen.listOfSuperTypesMenu;
    let menuObj = {};

    for(let t of types){
        menuObj[t] = {name: t, items: {}};
    }
    let gens = DataGen.listOfGens;
    for(let prop in gens){
        for(let t of types){
            if(gens[prop].prototype instanceof DataGen.superTypes[t]){
                menuObj[t].items[prop] = {};
                menuObj[t].items[prop].name = prop;
                break;
            }
        }

    }
    return menuObj;
}

//Substitui o botão submit para envio
/*$("#selectGeneratorType").click(function(){
    $("#fileupload").trigger("click");
    //"Neural Network Generator";
});

$("fileupload").change(function(){
    uploadFile(("upload-json"), ("upload-weights"));
});

function uploadFile(input_file_1, input_file_2){
    var file = [];
    file[0] = input_file_1[0].files[0];
    file[1] = input_file_2[0].files[0];
    return file;
}*/
