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
});