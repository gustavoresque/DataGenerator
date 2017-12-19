$("html").ready(function(){
    $("#generateButton").click(function(){
        $("#homeBtnNavBar").toggleClass("active", false);
        $("#resultBtnNavBar").toggleClass("active", true);
        $("#summaryTablePane").hide();
        $("#resultTablePane").show();
    });
    $("#resultBtnNavBar").click(function(){
        $(this).toggleClass("active");
        $("#homeBtnNavBar").toggleClass("active");
        $("#summaryTablePane").hide();
        $("#resultTablePane").show();
    });
    $("#homeBtnNavBar").click(function(){
        $(this).toggleClass("active");
        $("#resultBtnNavBar").toggleClass("active");
        $("#summaryTablePane").show();
        $("#resultTablePane").hide();
    });

    $("#tableCollumn").on("dblclick", "td.columnName", function(){
        var title = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", title).blur(function(){
            var cor = $(this).val();
            $(this).parent().text(cor);
        }));
    });

    $("#tableCollumn").on("dblclick", "td.columnType", function(){
        var typeData = $(this).text();
        $(this).empty();
        $(this).append($("<input/>").attr("type", "text").attr("value", typeData).blur(function(){
            var cor = $(this).val();
            $(this).parent().text(cor);
        }));
    });

    $("#tableCollumn").on("dblclick", "td.columnGen", function(){
        $(this).empty();
        $(this).append($("<select/>").attr("id", "selectGens").blur(function(){
            var cor = $(this).val();
            $(this).parent().text(cor);
        }));
        var listGens = listGenerators();
        for (var i = 0; i < listGens.length; i++){
            $(this).find("#selectGens").append($("<option/>").attr("value", listGens[i]).text(listGens[i]));
        }
        console.log($(this).parent().find("#tdIndex").text());
    });
});

var generatorToAdd;

function generateDatas(){
    document.getElementById("theadResult").innerHTML = "<tr>";
    var t = "";
    datagen.columns.forEach(function(item){
        t += "<th>" + item.generator.name + "</th>";
    });
    document.getElementById("theadResult").innerHTML += t;
    document.getElementById("theadResult").innerHTML += "</tr>";


    document.getElementById("tbodyResult").innerHTML = "<tr>\n";
    t = "";
    datagen.columns.forEach(function(item){
        t += "<td>" + item.generator.generate() + "</td>\n";
    });
    document.getElementById("theadResult").innerHTML += t;
    document.getElementById("tbodyResult").innerHTML += "</tr>";
}

function addGenerator(){
    let name = "Title";
    let type = "Numeric";
    let gen = "Counter Generator";

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

    datagen.addCollumn(name, type, generatorToAdd);
    writeLastGenerator();
}

function listGenerators(){
    let list = ['Counter Generator',
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
        'Sinusoidal Function'];

    let optionsGenerators = "";
    list.forEach(function(item){
        optionsGenerators += '<option value="' + item + '">' + item + '</option>\n';
    });

    return list;
}

function writeLastGenerator(){
    $("#tbody").empty();
    for(var i = 0; i < datagen.columns.length; i++){
        $("#tbody").append($("<tr/>")
            .append($("<td/>").text(i).attr('id', 'tdIndex'))
            .append($("<td/>").text(datagen.columns[i].name).addClass("columnName"))
            .append($("<td/>").text(datagen.columns[i].type).addClass("columnType"))
            .append($("<td/>").text(datagen.columns[i].generator.name).addClass("columnGen"))
        );
    }
}