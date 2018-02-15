$("html").ready(function(){
    $("#generateButton").click(function(){
        $("#homeBtnNavBar").toggleClass("active", false);
        $("#resultBtnNavBar").toggleClass("active", true);
        $("#summaryTablePane").hide();
        $("#resultTablePane").show();
    });
    $("#resultBtnNavBar").click(function(){
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
    });

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

    $("#tableCollumn").on("dblclick", "div.md-chip", function(){
        var orderGen = $(this).text().split("-")[0];
        $(this).empty();
        $(this).append($("<select/>").attr("id", "selectGens").blur(function(){
            var nameNewGenerator = $(this).val();
            $(this).empty();
            var newGen = chooseGenerator(nameNewGenerator);
            console.log("Embalo: " + $(this).parent().parent().parent().get(0).__node__.name);
            //if(!$(this).parent().get(0).__node__.changeGenerator(newGen, parseInt(orderGen))){
                $(this).parent().get(0).__node__ = newGen;
            //}
            $(this).parent().text(orderGen + "-" + nameNewGenerator);
        }));
        var listGens = listGenerators();
        for (var i = 0; i < listGens.length; i++){
            $(this).find("#selectGens").append($("<option/>").attr("value", listGens[i]).text(listGens[i]));
        }
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
    var t = "";
    t += "<th>" + "Order" + "</th>";
    datagen.columns.forEach(function(item){
        t += "<th>" + item.name + "</th>";
    });
    document.getElementById("theadResult").innerHTML += t + "</tr>";

    t = "";
    var number = $("#rowsQtInput").val();
    for (var i = 0; i < number; i++){
        document.getElementById("tbodyResult").innerHTML = "<tr>\n";
        t += "<td>" + (i+1) + "</td>\n";
        datagen.columns.forEach(function(item){
            t += "<td>" + item.generator.generate() + "</td>\n";
        });
        t += "</tr>";
    }
    document.getElementById("theadResult").innerHTML += t;
    document.getElementById("tbodyResult").innerHTML += "</tr>";
}

var generatorToAdd;
function chooseGenerator(gen){
    switch (gen){
        case "Counter Generator":
            generatorToAdd = new CounterGenerator();
            break;
        case "Gaussian Generator":
            generatorToAdd = new RandomGaussianGenerator();
            break;
        case "Poisson Generator":
            generatorToAdd = new RandomPoissonGenerator();
            break;
        case "Bernoulli Generator":
            generatorToAdd = new RandomBernoulliGenerator();
            break;
        case "Cauchy Generator":
            generatorToAdd = new RandomCauchyGenerator();
            break;
        case "Noise Generator":
            generatorToAdd = new RandomNoiseGenerator();
            break;
        case "Range Filter":
            generatorToAdd = new RangeFilter();
            break;
        case "Categorical":
            generatorToAdd = new RandomCategorical();
            break;
        case "Linear Function":
            generatorToAdd = new LinearFunction();
            break;
        case "Quadratic Function":
            generatorToAdd = new QuadraticFunction();
            break;
        case "Polynomial Function":
            generatorToAdd = new PolynomialFunction();
            break;
        case "Exponential Function":
            generatorToAdd = new ExponentialFunction();
            break;
        case "Logarithm Function":
            generatorToAdd = new LogarithmFunction();
            break;
        default:
            generatorToAdd = new SinusoidalFunction();
    }

    return generatorToAdd;
}

function addGenerator(){
    datagen.addCollumn("Title", "Numeric", new CounterGenerator());

    showGenerators();
}

function listGenerators(){
    let list = [
        'Counter Generator',
        'Gaussian Generator',
        'Poisson Generator',
        'Bernoulli Generator',
        'Cauchy Generator',
        'Noise Generator',
        'Range Filter',
        'Categorical',
        'Linear Function',
        'Quadratic Function',
        'Polynomial Function',
        'Exponential Function',
        'Logarithm Function',
        'Sinusoidal Function'
    ];

    return list;
}

function showGenerators(){
    $("#tbody").empty();
    for(var i = 0; i < datagen.columns.length; i++){
        var $tr = $("<tr/>");
        $("#tbody").append($tr
            .append($("<td/>").append($("<input/>").attr("type", "checkbox")))
            .append($("<td/>").text(i+1).addClass("tdIndex"))
            .append($("<td/>").text(datagen.columns[i].name).addClass("columnName"))
            .append($("<td/>").text(datagen.columns[i].type).addClass("columnType"))
        );
        let generators = [];
        let $tdGen = $("<td/>").addClass("columnGen");
        datagen.columns[i].generator.getFullGenerator(generators);
        var counter = 0;
        for(let gen of generators){
            let $chip = $("<div/>").addClass("md-chip md-chip-hover").text(gen.order + "-" + gen.name);
            $chip.get(0).__node__ = gen;
            $tdGen.append($chip);
            counter++;
        }
        $tdGen.append($("<span/>")
                .addClass("btnGenerator btnAddGen icon icon-plus-circled")
            ).append($("<span/>")
            .addClass("btnGenerator btnRemoveGen icon icon-cancel-circled")
        );
        $tr.append($tdGen);

        $tr.get(0).__node__ = datagen.columns[i];
        $tr.append($("<td/>").addClass("btnGenerator btnRemoveColumn icon icon-cancel-circled"))
    }
}