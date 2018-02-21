var datagen = [new DataGen(), new DataGen()];
let activeGenerator;

$("html").ready(function(){
    /*$("#resultBtnNavBar").click(function(){
        $(this).toggleClass("active", true);
        $("#homeBtnNavBar").toggleClass("active", false);
        $("#summaryTablePane").hide();
        $("#resultTablePane").show();
    });
    $("#homeBtnNavBar").click(function(){
        $(this).toggleClass("active", true);
        $("#resultBtnNavBar").toggleClass("active", false);
        $("#summaryTablePane").show();
        $("#resultTablePane").hide();
    });*/

    $("#tableCollumn").on("dblclick", "td.columnName", function(){
        var title = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", title).blur(function(){
            var cor = $(this).val();
            $(this).parent().parent().get(0).__node__.name = cor;
            $(this).parent().text(cor);
        }));
    });

    $("#tableCollumn").on("dblclick", "td.columnType", function(){
        var typeData = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", typeData).blur(function(){
            var cor = $(this).val();
            $(this).parent().parent().get(0).__node__.type = cor;
            $(this).parent().text(cor);
        }));
    });

    $("#tableCollumn").on("click", "div.md-chip", configGenProps);

    $("#generatorPropertiesForm").on("change blur", "input,select", function(){
        let $input = $(this);
        if($input.attr("data-type") === "number")
            this.__node__[$input.attr("data-variable")] = parseFloat($input.val());
        else if($input.attr("data-type") === "array")
            this.__node__[$input.attr("data-variable")] = $input.val().split(",");
        else if($input.attr("data-type") === "Generator")
            this.__node__[$input.attr("data-variable")] = new (DataGenerator.prototype.listOfGens[$input.val()])();
        else if($input.attr("data-type") === "Column") {
            this.__node__[$input.attr("data-variable")] = datagen.columns[parseInt($input.val())].generator;
            this.__node__.inputGenIndex = parseInt($input.val());
        }
    });

    $("#selectGeneratorType").on("change blur", function(){
        let nameNewGenerator = $(this).val();
        let newGen = new (datagen.listOfGens[nameNewGenerator])();
        //substitui o gerador na estrutura.
        console.log(datagen.listOfGens[nameNewGenerator]);

        $(this).get(0).__node__.changeGenerator(newGen);
        activeGenerator = newGen;
        let $active_chip = showGenerators();
        configGenProps.apply($active_chip);
    });

    $("#rowsQtInput").blur(function(){
        $(".tooltiptext").css("visibility", "hidden").css("opacity", 0);
    });

    $(".tooltip").click(function(){
        if($(".tooltiptext").css("visibility") === "hidden")
            $(".tooltiptext").css("visibility", "visible").css("opacity", 1);
        else
            $(".tooltiptext").css("visibility", "hidden").css("opacity", 0);
    });

    $("#tableCollumn").on("click", "span.btnRemoveGen", function(){
        datagen.removeLastGenerator(parseInt($(this).parent().parent().find(".tdIndex").text()) - 1);
        showGenerators();
    });

    $("#tableCollumn").on("click", "span.btnAddGen", function(){
        console.log("Adicionar Generator no index: " + $(this).parent().parent().find(".tdIndex").text());
        datagen.addGeneratorToIndex(parseInt($(this).parent().parent().find(".tdIndex").text())-1, new CounterGenerator())
        showGenerators();
    });

    $("#tableCollumn").on("click", "td.btnRemoveColumn", function(){
        datagen.removeCollumn(parseInt($(this).parent().find(".tdIndex").text()) - 1);
        showGenerators();
    });
});

function generateDatas(){
    document.getElementById("theadResult").innerHTML = "<tr>";
    let t = "";

    datagen.columns.forEach(function(item){
        t += "<th>" + item.name + "</th>";
    });
    document.getElementById("theadResult").innerHTML += t + "</tr>";

    datagen.n_lines = $("#rowsQtInput").val();
    let data = datagen.generate();

    document.getElementById("tbodyResult").innerHTML="";
    for (let i = 0; i < data.length; i++) {
        let tr = document.createElement('TR');
        for (let j = 0; j < data[i].length; j++) {
            let td = document.createElement('TD');
            td.appendChild(document.createTextNode(data[i][j]));
            tr.appendChild(td)
        }
        document.getElementById("tbodyResult").appendChild(tr);
    }
}

function addGenerator(){
    datagen.addCollumn("Column "+(datagen.columns.length+1), "Numeric", new CounterGenerator());

    showGenerators();
}

function showGenerators(){
    let active_gen_chip;
    $("#tbody").empty();
    for(var i = 0; i < datagen[0].columns.length; i++){
        var $tr = $("<tr/>");
        $("#tbody").append($tr
            .append($("<td/>").append($("<input/>").attr("type", "checkbox")))
            .append($("<td/>").text(i+1).addClass("tdIndex"))
            .append($("<td/>").text(datagen[0].columns[i].name).addClass("columnName"))
            .append($("<td/>").text(datagen[0].columns[i].type).addClass("columnType"))
        );
        let generators = [];
        let $tdGen = $("<td/>").addClass("columnGen");

        datagen[0].columns[i].generator.getFullGenerator(generators);
        var counter = 0;

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
        $tr.append($tdGen);

        $tr.get(0).__node__ = datagen.columns[i];
        $tr.append($("<td/>").addClass("btnGenerator btnRemoveColumn icon icon-trash"))
    }
    return active_gen_chip;
}

function putGeneratorOptions(select, selected, noise) {
    let list = noise ? DataGenerator.prototype.listOfGensForNoise : DataGenerator.prototype.listOfGens;
    for(let attr in  list){
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

    let generator = $(this).get(0).__node__;
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

        }else if(p.type === "array"){
            let $input = $("<input/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("type","text")
                .attr("onkeydown", "if (event.keyCode == 13) return false;")
                .attr("value", generator[p.variableName])
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $input.get(0).__node__ = generator;
            $tr.append($("<td/>").append($input));

        }else if(p.type === "Generator"){
            console.log(generator[p.variableName]);
            let $select = $("<select/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);
            $select.get(0).__node__ = generator;
            putGeneratorOptions($select, generator[p.variableName], true);
            $tr.append($("<td/>").append($select));

        }else if(p.type === "Column"){
            let $select = $("<select/>")
                .addClass("form-control")
                .addClass("smallInput")
                .attr("id", "input_"+p.variableName)
                .attr("data-variable", p.variableName)
                .attr("data-type", p.type);

            $select.get(0).__node__ = generator;

            //Preenche a lista de seleção para funções
            //Só podem ser utilizadas as colunas anteriores a essa.

            for(let i=0; i<datagen.columns.length; i++){
                if(datagen.columns[i] !== coluna){
                    let $option = $("<option/>").attr("value", i).text(datagen.columns[i].name);
                    $option.get(0).__node__ = datagen.columns[i];

                    if(generator[p.variableName] === datagen.columns[i].generator){
                        console.log("entrou.....");
                        $option.attr("selected", "selected");
                    }
                    $select.append($option);
                }else{
                    break;
                }
            }


            $tr.append($("<td/>").append($select));
        }
    }
    tippy('.tooltip-label');

}

function createNewModel (msg) {
    alert('File opened: ' + msg);
}

function createImportModel () {
    alert('Create import model');
}

function createExportModel () {
    alert('Create export model');
}

function minhafuncao(){
    alert("HAHAHAH");
    document.getElementById('business').click();
}