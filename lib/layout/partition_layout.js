/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


let setupFunction = function () {

    let partitionObj = this;

    let parent_id = "partition-" + random_id();

    let nodes = {id: parent_id, children: [], divisions: []};

    let $partition_root = $(".partition-root");
    addNode(nodes, $partition_root.empty());




    let highlight_line_div = $("<div/>").addClass("partition-divisor").attr("id", "partition-highlight")
        .append($("<div/>").addClass("partition-divisor-line"));
    let target_border, target;
    let selected_node;
    let init_x, init_y;

    $partition_root.attr("id", parent_id).on("mousedown", ".partition-line", function(e){


        init_x = e.pageX;
        init_y = e.pageY;
        target_border = $(e.target);


        target = target_border.parent();


        target.append(highlight_line_div);

        selected_node = target.get(0).__node__;



        //var parent_html = $("#"+selected_node.parent.id);
        let target_attr, brother_attr;
        let xOrY;

        switch (getOriByClass(target_border.attr("class"))){
            case "left":
                target_attr = "left";
                brother_attr = "right";
                xOrY = "pageX";
                highlight_line_div.addClass("partition-dir-ver");
                break;
            case "top":
                target_attr = "top";
                brother_attr = "bottom";
                xOrY = "pageY";
                highlight_line_div.addClass("partition-dir-hor");
                break;
            case "right":
                target_attr = "right";
                brother_attr = "left";
                xOrY = "pageX";
                highlight_line_div.addClass("partition-dir-ver");
                break;
            case "bottom":
                target_attr = "bottom";
                brother_attr = "top";
                xOrY = "pageY";
                highlight_line_div.addClass("partition-dir-hor");
                break;
        }


        // parent_html.children().each(function(i, j){
        //     if(j.__node__ && !isBrother(target.get(0).__node__[target_attr], j.__node__[brother_attr]) && target.get(0)!==j){
        //         $(j).addClass("partition-cursor-error");
        //     }
        // });
        // $partition_root.children
        // console.log(target.get(0));
        // console.log($partition_root.find("div.partition-node").not(target.get(0)));
        $partition_root.find("div.partition-node").not(target.get(0)).addClass("partition-cursor-error");

        let signal = (target_attr==="left"||target_attr==="top"?1:-1);
        let init = (target_attr==="left"||target_attr==="right"?init_x:init_y);
        // console.log(target_attr, signal*e2[xOrY] + (signal*-1)*init);
        highlight_line_div.css(target_attr, (signal*-1)*init-10);

        $partition_root.get(0).onmousemove = function(e2){

            // console.log(target_attr, signal*e2[xOrY] + (signal*-1)*init);
            highlight_line_div.css(target_attr, signal*e2[xOrY] + (signal*-1)*init-10);
            // highlight_line_div.css("z-index",);
            // console.log(highlight_line_div);
//                    highlight_line_div.css("");
        };

    });

    let divisor_target;
    $partition_root.attr("id", parent_id).on("mousedown", ".partition-divisor", function(e){

        let $target = $(e.target);

        if($target.hasClass("partition-divisor-line"))
            $target = $target.parent();
        divisor_target = $target;

        init_x = e.pageX;
        init_y = e.pageY;

        //Adiciona o Highlight no parent
        divisor_target.parent().append(highlight_line_div);
        highlight_line_div.addClass($target.attr("class"));

        let dir = $target.get(0).__node__.dir;
        let init = (dir==="ver"?init_x:init_y);
        let target_attr = (dir==="ver"?"left":"top");
        let xOrY = dir==="ver"?"pageX":"pageY";
        let last_position = parseFloat($target.css(target_attr));

        highlight_line_div.css(target_attr, last_position);

        $target.parent().get(0).onmousemove = function(e2){

            highlight_line_div.css(target_attr, last_position + e2[xOrY] - init);

//                    highlight_line_div.css("");
        };

    });

//    var first_part_node = {id: id, children: [], parent: nodes, left: 0, top: 0, right: 0, bottom: 0};
//    nodes.children.push(first_part_node);
//    first_node.get(0).__node__ = first_part_node;

    $partition_root.attr("id", parent_id).on("mousedown", ".partition-node", function(e){

        let $node = $(e.target);


        while($node.attr("class").indexOf("partition-node")<0){
            $node = $node.parent();
        }
        let $content = $node.children(".partition-content").children();

        //Se o nó não está atualmente selecionado, então ele selecionad
        let real_target = $node.get(0);
        if(partitionObj.selected_node !== real_target){
            partitionObj.selected_node = real_target;
            partitionObj.onselectednode(real_target.__node__, real_target);
        }
    });



    redraw(nodes);




    $(window).mouseup(function(e){


        if(target_border){
            $partition_root.get(0).onmousemove = null;
            target.children(".partition-divisor").remove();
            var dev = 0;
            var brother_attr, target_attr, parent_attr;
            var parent_html = $("#"+selected_node.parent.id);

            //Remove todos os cursors erros.
            // parent_html.children().each(function(i, j){
            //     $(j).removeClass("partition-cursor-error");
            // });
            $partition_root.find("div.partition-node").not(target.get(0)).removeClass("partition-cursor-error");


            var border_dir = getOriByClass(target_border.attr("class"));

            removeHighlight(highlight_line_div);
            target_border = undefined;


            let rootOffset = $partition_root.offset();
            let pageX = putInside(e.pageX, rootOffset.left, rootOffset.left+$partition_root.width());
            let pageY = putInside(e.pageY, rootOffset.top, rootOffset.top+$partition_root.height());

            //Adiciona ou Atualiza
            switch (border_dir){
                case "left":

                    dev = pageX - parent_html.offset().left;
                    target_attr = "left";
                    brother_attr = "right";
                    parent_attr = "width";
                    break;
                case "top":
                    dev = pageY - parent_html.offset().top;
                    target_attr = "top";
                    brother_attr = "bottom";
                    parent_attr = "height";
                    break;
                case "right":
                    dev = pageX - parent_html.offset().left;
                    target_attr = "right";
                    brother_attr = "left";
                    parent_attr = "width";
                    break;
                case "bottom":
                    dev = pageY - parent_html.offset().top;
                    target_attr = "bottom";
                    brother_attr = "top";
                    parent_attr = "height";
                    break;
            }

            var brother;
            let target_position = parseFloat(target.css(target_attr))/parent_html[parent_attr]();
            var current_dir = parent_attr === "width" ? "ver" : "hor";
            if( isInside(target, pageX, pageY)){

                if(selected_node.parent.dir === current_dir){
                    brother = addNode(selected_node.parent, parent_html, current_dir, selected_node);
                    // console.log("caso1", selected_node.parent);
                    let division_changed;
                    for(let d of selected_node.parent.divisions){
                        if(isBrother(d.value, target_position) || isSame(d.value, target_position)){
                            division_changed = d;
                        }
                    }
                    console.log(division_changed);
                    if(selected_node === division_changed.node1) {
                        division_changed.node1 = brother[0];
                    }else if(selected_node === division_changed.node2){
                        division_changed.node2 = brother[0];
                    }

                }else if(selected_node.parent.dir){
                    //Cria um novo target e brother e coloca dentro do target atual que vi o pai.
                    parent_html = $("#"+selected_node.id);
                    parent_html.children(".partition-line").remove();
                    //cria irmão e novo target
                    let newtarget = addNode(selected_node, parent_html, current_dir);
                    brother = addNode(selected_node, parent_html, current_dir);
                    //Atualiza o dir do novo pai
                    selected_node.dir = current_dir;
                    //troca tudo!
//                    target = $(newtarget[1]);
                    parent_html.children(".partition-content").children()
                        .appendTo($(newtarget[1]).children(".partition-content").get(0));
                    parent_html.children(".partition-content").remove();
                    selected_node = newtarget[0];

                    // console.log("caso2", brother);

                }else{

                    brother = addNode(selected_node.parent, parent_html, current_dir);
                    selected_node.parent.dir = current_dir;
                    // console.log("caso3", brother);
                }
            }


            //Criar função disso!
            //verificar se está dentro do irmão ou dentro dele mesmo.
            let invert = (target_attr === "left" || target_attr === "top");

            if(brother && (isInside(target, pageX, pageY) || isInside($(brother[1]), pageX, pageY))){
                //Atualiza as posições
                let value = (parent_html[parent_attr]()-dev)/parent_html[parent_attr]();

                brother[0][brother_attr] = (invert ? value : 1-value);
                selected_node[target_attr] = (invert ? 1-value : value);

                //o brother[2] é o objeto responsável pela divisão entre o selected_node e o brother.
                //Atualiza o valor para a divisão
                brother[2].value = 1-value;
                //DONE - quando puxa do meio tem ser o irmão do selected_node! Porra!
                //Porque ele abre um novo node no meios dos dois existentes
                brother[2].node1 = selected_node;
                brother[2].node2 = brother[0];

                remove_unvisible(nodes);
                fix(nodes);
                redraw(nodes);
            }


        } else if(divisor_target){


            let node = divisor_target.get(0).__node__;
            let $parent = divisor_target.parent();
            // let parent_w = $parent.width(), parent_h = $parent.height();


            let $node1 = $("#"+node.node1.id), $node2 = $("#"+node.node2.id);

            // let min_left = Math.min(node.node1.left * parent_w, node.node2.left * parent_w);
            // let min_top = Math.min(node.node1.top * parent_h, node.node2.top * parent_h);
            let min_left = Math.min($node1.offset().left, $node2.offset().left);
            let min_top = Math.min($node1.offset().top, $node2.offset().top);


            let pageX = putInside(e.pageX, min_left, min_left
                +$node1.width()+$node2.width());
            let pageY = putInside(e.pageY, min_top, min_top+
                $node1.height()+$node2.height());

            console.log("min_top", min_top, "max", min_top+$node1.height()+$node2.height());

            removeHighlight(highlight_line_div);

            divisor_target.parent().get(0).onmousemove = undefined;

            divisor_target = undefined;

            let last_value = node.value;

            let ori1, ori2;
            if(node.dir === "ver"){
                node.value = (pageX-$parent.offset().left)/$parent.width();
                ori1 = "left";
                ori2 = "right";
            }else{
                node.value = (pageY-$parent.offset().top)/$parent.height();
                ori1 = "top";
                ori2 = "bottom";
            }

            if(isBrother(node.node1[ori2], last_value)){
                node.node1[ori2] = 1 - node.value;
                node.node2[ori1] = node.value;
            }else if(isBrother(node.node1[ori1], last_value)){
                node.node1[ori1] = 1 - node.value;
                node.node2[ori2] = node.value;
            }else if(isSame(node.node1[ori1], last_value)){
                node.node1[ori1] = node.value;
                node.node2[ori2] = 1-node.value;
            }else if(isSame(node.node1[ori2], last_value)){
                node.node1[ori2] = node.value;
                node.node2[ori1] = 1- node.value;
            }

            remove_unvisible(nodes);
            fix(nodes);
            redraw(nodes);
            partitionObj.onnoderesized(node.node1, $node1);
            partitionObj.onnoderesized(node.node2, $node2);
        }
    });




    function addDragableLines(selection){
        selection.append($("<div/>").addClass("partition-line").addClass("partition-ori-left"))
            .append($("<div/>").addClass("partition-line").addClass("partition-ori-right"))
            .append($("<div/>").addClass("partition-line").addClass("partition-ori-top"))
            .append($("<div/>").addClass("partition-line").addClass("partition-ori-bottom"));
    }

    function addContent(selection){
        selection.append($("<div/>").addClass("partition-content"));
    }

    function remove_unvisible(node){
        if(node.left===1 || node.right===1 || node.top===1 || node.bottom===1
            || isBrother(node.top, node.bottom) || isBrother(node.left, node.right)){

            //remove ou merge os divisores que se referem a ele
            let divisions = [];
            var index = 0, i=0;
            for(let d of node.parent.divisions){
                if(d.node1 === node || d.node2 === node) {
                    divisions.push(d);
                    index = i;
                }
                i++;
            }
            if(divisions.length === 1){
                $(divisions[0].div_element).remove();
            }else{
                if(divisions[0].node1 === divisions[1].node1){
                    divisions[0].node1 = divisions[1].node2;
                }else if(divisions[0].node1 === divisions[1].node2){
                    divisions[0].node1 = divisions[1].node1;
                }else if(divisions[0].node2 === divisions[1].node1){
                    divisions[0].node2 = divisions[1].node2;
                }else if(divisions[0].node2 === divisions[1].node2){
                    divisions[0].node2 = divisions[1].node1;
                }
                divisions[1].div_element.remove();
            }
            node.parent.divisions.splice(index,1);
            console.log("deveria remover!");
            //remove o elemento em si.
            $("#"+node.id).remove();
            let position = -1;
            for(var i=0;i<node.parent.children.length; i++)
                if(node.parent.children[i].id === node.id)
                    position = i;

            console.log(node.parent.children);
            if(position !== -1){
                node.parent.children.splice(position,1);
                return;
            }
            partitionObj.onnoderemoved(node);
        }

        for (i = 0; i < node.children.length; i++) {
            remove_unvisible(node.children[i]);
        }
    }

    function fix(node){
        if(node.parent && node.parent.children.length === 1 && node.parent.parent){
            var current_node = $("#"+node.id);
            current_node.children().appendTo($("#"+node.parent.id).get(0));
            current_node.remove();
            node.parent.children = node.children;
            for(var i=0; i<node.children.length; i++){
                node.children[i].parent = node.parent;
            }
            node = node.parent;
        }

        for (var i = 0; i < node.children.length; i++) {
            fix(node.children[i]);
        }
    }

    function redraw(node) {

        //Posiciona os divisores

        let $_node = $("#" + node.id);
        let leftOrTop = node.dir==="ver"?"left":"top";
        let wOrH = node.dir==="ver"?"width":"height";
        for(let divisor of node.divisions){
            divisor.div_element.css(leftOrTop, ($_node[wOrH]() * divisor.value)-10);
        }

        if(node.parent){

            let $_parent = $("#" + node.parent.id);



            // posicina e dá tamanho para as divs em si
            $_node.css({
                left: $_parent.width() * node.left,
                right: $_parent.width() * node.right,
                top: $_parent.height() * node.top,
                bottom: $_parent.height() * node.bottom
            });

        }

        for (var i = 0; i < node.children.length; i++) {
            redraw(node.children[i]);
        }
    }

    function addNode(node_data, node_selection, current_dir, brother){

        let id = node_data.id+"-"+random_id();
        let new_node = {id: id, divisions: [], children: [], parent: node_data, left: 0, top: 0, right: 0, bottom: 0};
        if(brother){
            new_node.left = brother.left;
            new_node.top = brother.top;
            new_node.right = brother.right;
            new_node.bottom = brother.bottom;
        }
        node_data.children.push(new_node);

        let html_node = $("<div/>").addClass("partition-node").attr("id", id);
        addDragableLines(html_node);
        addContent(html_node);
        node_selection.append(html_node);

        let divisor, divisor_node;
        //Se tiver mais de um filho tem que colocar uma divisória
        if(node_data.children.length > 1 && current_dir){

            divisor = $("<div/>").addClass("partition-divisor partition-dir-"+current_dir)
                .append($("<div/>").addClass("partition-divisor-line"));
            node_selection.append(divisor);

            divisor_node  = {div_element: divisor, value: 0, dir: current_dir};
            divisor.get(0).__node__ = divisor_node;
            node_data.divisions.push(divisor_node);
        }


        if(node_data.dir){
            new_node.dir = node_data.dir === "ver" ? "hor" : "ver";
        }

        html_node.get(0).__node__ = new_node;

        partitionObj.onnodecreated(new_node, html_node.get(0));
        return [new_node, html_node, divisor_node];

    }

    function random_id() {
        return Math.floor(Math.random() * 1000);
    }

    function getOriByClass(class_name){
        return /partition-ori-(\w+)/g.exec(class_name)[1];
    }

    function isBrother(a, b){
        return Math.abs(a+b -1) < 0.00001;
    }
    function isSame(a, b){
        return Math.abs(a-b) < 0.00001;
    }

    function isInside(selection, x, y){
        var posX = x - selection.offset().left;
        var posY = y - selection.offset().top;
        return (posX >= 0) && (posX <= selection.width()) && (posY >= 0) && (posY <= selection.height());
    }

    function putInside(n, min, max){
        return Math.min(Math.max(n, min), max);
    }

    function removeHighlight(highlight) {
        highlight.removeClass("partition-dir-ver");
        highlight.removeClass("partition-dir-hor");
        highlight.css({
            left: 0, right: 0, top: 0, bottom: 0
        });
        highlight.removeAttr("style");
        highlight.remove();
    }

    $(window).resize(function(){
        redraw(nodes);
    });

    let ctrl_press = false;
    $(document).on("keydown", function(e){
        // if(e)


        //CTRL
        if(e.keyCode === 17 && !ctrl_press){
            ctrl_press = true
            $(".partition-line").css("display", "block");
        }
    }).on("keyup", function(e){

        //CTRL
        if(e.keyCode === 17){
            ctrl_press = false;
            $(".partition-line").css("display", "none");
        }
    });

};

let createRootisNotExists = function(){
    let $root = $(this.root);
    if($(".partition-root").length === 0 && $root.length > 0){
        $root.append($("<div/>").addClass("partition-root"));
    }
};



class PartitionClass{

    constructor (root){
        this.root = root;
        createRootisNotExists.apply(this);
        setupFunction.apply(this);
    }

    addNode(){

    }

    removeNode(){

    }

    onselectednode(node){}
    onnodecreated(node){}
    onnoderesized(node){}
    onnoderemoved(node){}


}

var PartitionLayout = PartitionClass;