// function (d) {
//     let colliding = true;
//     let cx = 0, cy = beeswarm.y[k](d[k]), ccx, ccy;
//     while(colliding){
//         let dd = 4*beeswarm.settings.radius*beeswarm.settings.radius;
//         colliding = false;
//         for(let col of circlesCollision){
//             if((col.cx-cx)*(col.cx-cx)+(col.cy-cy)*(col.cy-cy) < dd){
//                 ccx = col.cx; ccy = col.cy;
//                 colliding = true;
//                 break;
//             }
//         }
//         if(colliding){
//             cx = posWoutColl(ccx,ccy,cy,dd,1)+1;
//         }else{
//             circlesCollision.push({cx, cy});
//         }
//     }
//     return cx;
// }


// (d) => {
//     let cy = beeswarm.y[k](d[k]);
//     let r = this.settings.radius;
//     let colls = quadtree.getCollisions({
//         x1: 0,
//         y1: cy-r,
//         x2: this.boxWidth/2 - r*2,
//         y2: cy+r
//     });
//     console.log(colls.length);
//     let maxc = colls[0];
//     for(let i=0; i<colls.length; i++){
//         if(colls[i].cx > maxc.cx){
//             maxc = colls[i];
//         }
//     }
//     let dd = 4*r*r;
//     let cx = maxc ? posWoutColl(maxc.cx,maxc.cy,cy,dd,1)+1 : 0;
//     quadtree.insert({
//         x1: cx-r,
//         y1: cy-r,
//         x2: cx+r,
//         y2: cy+r
//     }, {cx,cy});
//     return cx;
// }




class Visualization {

    constructor(parentElement, settings){
        //default configuration
        this.parentElement = parentElement;
        console.log(this.parentElement);
        this.settings = {
            color: "grey",//"#069",
            highlightColor: "#FF1122",//"#08E700",
            opacity: 1,
            size_type: "fit",//"absolute"
            width: 700,
            height: 300,
            paddingTop: 25,
            paddingLeft: 50,
            paddingRight: 50,
            paddingBottom: 30
        };
        //sobreescreve as configurações padrão pelas configurações dadas por parâmetro.
        if(typeof settings === "object"){
            for(let p in this.settings){
                if(this.settings.hasOwnProperty(p) && settings.hasOwnProperty(p))
                    this.settings[p] = settings[p];
            }
        }


        this.event = d3.dispatch("brush", "draw", "highlightstart", "highlightend",
            "datamouseover","datamouseout", "dataclick");

        let fit = this.settings.size_type === "fit";

        this.svg = d3.select(parentElement).style("overflow", "hidden")
            .append("svg")
            .attr("width", fit ? "100%" : this.settings.width)
            .attr("height", fit ? "100%" : this.settings.height);

        this.canvas = this.svg.append("g");
        this.background = this.canvas.append("g")
            .attr("class", "background")
            .attr("transform", "translate("+this.settings.paddingLeft+","+this.settings.paddingTop+")");

        this.foreground = this.canvas.append("g")
            .attr("class", "foreground")
            .attr("transform", "translate("+this.settings.paddingLeft+","+this.settings.paddingTop+")");

        this.overlay = this.canvas.append("g")
            .attr("class", "overlay")
            .attr("transform", "translate("+this.settings.paddingLeft+","+this.settings.paddingTop+")");

        this.annotations = this.canvas.append("g")
            .attr("class", "annotations")
            .attr("transform", "translate("+this.settings.paddingLeft+","+this.settings.paddingTop+")");

        this.parentElement.__vis__ = this;

        this.isHighlighting = false;

    }


    data(d){
        this.d = d;
        this.keys = [];
        this.domain = {};
        this.domainType = {};
        for(let k in this.d[0]){
            if(this.d[0].hasOwnProperty(k)){
                this.keys.push(k);
                if(isNaN(+this.d[0][k])) {
                    if(/^\d{1,2}(:\d{1,2}){1,2}(\s*[AaPp][Mm])?$/.test(this.d[0][k])){
                        for(let i=0;i<this.d.length;i++) {
                            this.d[i][k] = new Date(Date.parse(this.d[i][k]));
                        }
                        this.domainType[k] = "Time";
                        this.domain[k] = d3.extent(this.d, (obj) => {return obj[k];});
                    }else{
                        this.domain[k] = _.uniq(_.pluck(this.d, k));
                        this.domainType[k] = "Categorical";
                    }
                } else {
                    this.domain[k] =  d3.extent(this.d, (obj) => {return obj[k]});
                    this.domainType[k] = "Numeric";
                }
            }
        }
        this.hasData = true;
        return this;
    }

    resize(){
        return this;
    }

    redraw(){
        return this;
    }

    setColor(color){
        if(arguments.length === 0)
            return this.settings.color;
        this.settings.color = color;
        return this;
    }

    on(e, func) {
        this.event.on(e, func);
        return this;
    };

    highlight(...args){
        if(!this.isHighlighting){
            this.isHighlighting = true;
            this.event.highlightstart.apply(this, args);
        }
    }
    removeHighlight(...args){
        if(this.isHighlighting){
            this.isHighlighting = false;
            this.event.highlightend.apply(this, args);
        }
    }
    getHighlightElement(i){

    }

    annotate(svgElement){
        this.annotations.node().appendChild(svgElement);
    }

    clearAnnotations(){
        this.annotations.selectAll("*").remove();
    }

}


class ParallelCoordinates extends Visualization{

    constructor(parentElement, settings){
        super(parentElement, settings);
        this.name = "ParallelCoordinates";

        this.lineFunction = (d) => {
            return d3.svg.line()(this.keys.map((key) => {
                return [this.x(key), this.y[key](d[key])];
            }))
        };

        this.x = d3.scale.ordinal().rangePoints([
            0,
            $(this.svg[0][0]).width()-this.settings.paddingLeft-this.settings.paddingRight
        ], 0);

    }

    resize(){

        let pl = this.settings.paddingLeft;
        let pr = this.settings.paddingRight;
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        if(this.x)
            this.x.rangePoints([0, $(this.svg[0][0]).width()-pl-pr], 0);
        else
            this.x = d3.scale.ordinal().rangePoints([0, $(this.svg[0][0]).width()-pl-pr], 0);

        if(this.y) {
            for (let prop of this.keys) {
                if (typeof this.y[prop].rangePoints === "function")
                    this.y[prop].rangePoints([$(this.svg[0][0]).height()-pt-pb, 0], 0);
                else
                    this.y[prop].range([$(this.svg[0][0]).height() -pt-pb, 0]);
            }
        }
        console.log("redraw");
        this.redraw();
        return this;
    }

    data(d){
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        super.data(d);

        this.x.domain(this.keys);
        this.y = {};
        for(let k of this.keys){
            if(this.domainType[k] === "Categorical") {
                this.y[k] = d3.scale.ordinal()
                    .domain(this.domain[k])
                    .rangePoints([$(this.svg[0][0]).height()-pt-pb, 0], 0);
            }else if(this.domainType[k] === "Time"){
                //TODO: Melhorar a escala para o tempo.
                this.y[k] =  d3.time.scale()
                    .domain(this.domain[k])
                    .range([$(this.svg[0][0]).height()-pt-pb, 0]);
            } else {
                this.y[k] =  d3.scale.linear()
                    .domain(this.domain[k])
                    .range([$(this.svg[0][0]).height()-pt-pb, 0]);
            }
        }

    }


    redraw(){

        if(!this.hasData)
            return;

        let axis = d3.svg.axis().orient("left");
        //Atualiza os Eixos
        let y_axes = this.y;



        this.foreground.selectAll("path.data")
            .data(this.d).enter()
            .append("path")
            .attr("class", "data")
            .attr("data-index", function(d,i){ return i; })
            .attr("d", this.lineFunction)
            .style("stroke", this.settings.color)
            .on("mouseover", (d,i) =>{ this.event.datamouseover(d,i); })
            .on("mouseout", (d,i) =>{ this.event.datamouseout(d,i); })
            .on("click", (d,i) =>{ this.event.dataclick(d,i); });
        this.foreground.selectAll("path.data")
            .data(this.d)
            .attr("d", this.lineFunction)
            .style("stroke", this.settings.color);
        this.foreground.selectAll("path.data")
            .data(this.d)
            .exit()
            .remove();

        this.overlay.selectAll(".axis")
            .data(this.keys)
            .exit().remove();
        this.axis = this.overlay.selectAll(".axis")
            .data(this.keys)
            .attr("transform", (d) => { return "translate(" + this.x(d) + ")"; })
            .each(function(d) { d3.select(this).call(axis.scale(y_axes[d])); });
        this.axis.select("text.column_label")
            .text(function(d) { return d; });

        this.axis = this.overlay.selectAll(".axis")
            .data(this.keys)
            .enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", (d) => { return "translate(" + this.x(d) + ")"; })
            .each(function(d) { d3.select(this).call(axis.scale(y_axes[d])); });

        // Add an axis and title.
        this.axis.append("text")
            .style("text-anchor", "middle")
            .attr("class", "column_label")
            .attr("y", -9)
            .text(function(d) { return d; });


    }

    highlight(...args){
        let parallelcoordinates = this;

        if(args[0] instanceof SVGElement){

        }else if(typeof args[1] === "number" && args[1] >= 0 && args[1] < this.d.length){
            // this.foreground.select
            // d3.select(args[0])
            this.foreground.selectAll('path.data[data-index="'+args[1]+'"]')
                .style("stroke", parallelcoordinates.settings.highlightColor)
                .style("stroke-width", "2")
                .each(function(){
                    // parallelcoordinates.overlay.node()
                    //     .appendChild(d3.select(this.cloneNode())
                    //         .attr("class", "lineHighlight")
                    //         .style("stroke", parallelcoordinates.settings.highlightColor)
                    //         .style("stroke-width", "2")
                    //         .style("fill", "none")
                    //         .node());
                    this.parentNode.appendChild(this);
                });
        }
        super.highlight.apply(this, args);
    }
    removeHighlight(...args){
        if(args[1] instanceof SVGElement){

        }else if(typeof args[1] === "number" && args[1] >= 0 && args[1] < this.d.length){
            this.foreground.selectAll('path.data[data-index="'+args[1]+'"]')
                .style("stroke", this.settings.color)
                .style("stroke-width", "1");
            // this.overlay.selectAll(".lineHighlight").remove();
            this.event.highlightend.apply(null, args);
        }
        super.removeHighlight.apply(this, args);
    }
    getHighlightElement(i){
        let parallelcoordinates = this;
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        d3.select(group).attr("class", "groupHighlight");
        this.foreground.selectAll('path.data[data-index="'+i+'"]').each(function(){
            group.appendChild(d3.select(this.cloneNode())
                .attr("class", "lineHighlight")
                .style("stroke", parallelcoordinates.settings.highlightColor)
                .style("stroke-width", "2")
                .style("fill", "none")
                .node());
        });
        return group;
    }

}

class ScatterplotMatrix extends Visualization{

    constructor(parentElement, settings){
        super(parentElement, settings);
        this.settings.innerPadding = settings? settings.innerPadding || 8 : 8;
        this.settings.paddingRight = settings? settings.paddingRight || 20 : 20;
        this.name = "ScatterplotMatrix";

        // this.x = d3.scale.linear()
        //     .range([padding / 2, size - padding / 2]);
        //
        // var y = d3.scale.linear()
        //     .range([size - padding / 2, padding / 2]);

        this.xAxis = d3.svg.axis()
            .orient("bottom")
            .ticks(6);

        this.yAxis = d3.svg.axis()
            .orient("left")
            .ticks(6);

    }

    resize(){
        let pl = this.settings.paddingLeft;
        let pr = this.settings.paddingRight;
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        let ip = this.settings.innerPadding;

        this.cellWidth = ($(this.svg[0][0]).width()-pl-pr-ip*(this.keys.length-1))/this.keys.length;
        this.cellHeight = ($(this.svg[0][0]).height()-pt-pb-ip*(this.keys.length-1))/this.keys.length;

        for(let k of this.keys){
            if(this.domainType[k] === "Categorical"){
                this.x[k].rangePoints([0, this.cellWidth], 0);
                this.y[k].rangePoints([0, this.cellHeight], 0);
            }else{
                this.x[k].range([0, this.cellWidth]);
                this.y[k].range([this.cellHeight, 0]);
            }
        }
        // console.log("redraw");
        this.redraw();
        return this;
    }

    data(d){
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        let pl = this.settings.paddingLeft;
        let pr = this.settings.paddingRight;
        let ip = this.settings.innerPadding;
        super.data(d);

        this.cellWidth = ($(this.svg[0][0]).width()-pl-pr-ip*(this.keys.length-1))/this.keys.length;
        this.cellHeight = ($(this.svg[0][0]).height()-pt-pb-ip*(this.keys.length-1))/this.keys.length;

        this.x = {};
        this.y = {};
        for(let k of this.keys){
            if(this.domainType[k] === "Categorical"){
                this.x[k] = d3.scale.ordinal()
                    .domain(this.domain[k])
                    .rangePoints([0, this.cellWidth], 0);
                this.y[k] = d3.scale.ordinal()
                    .domain(this.domain[k])
                    .rangePoints([0, this.cellHeight], 0);
            }else{
                this.x[k] =  d3.scale.linear()
                    .domain(this.domain[k])
                    .range([0, this.cellWidth]);
                this.y[k] =  d3.scale.linear()
                    .domain(this.domain[k])
                    .range([this.cellHeight, 0]);
            }
        }

    }


    redraw(){


        //Atualiza os Eixos
        let y_axes = this.y;

        let crossed = ScatterplotMatrix.cross(this.keys, this.keys);
        console.log(crossed);
        let scatterplot = this;

        function redrawDataPoints(k) {

            let cell = d3.select(this);


            cell.selectAll("circle.dataPoints")
                .data(scatterplot.d).enter()
                .append("circle")
                .attr("class", "dataPoints")
                .attr("data-index", function(d,i){ return i; })
                .attr("data-col", k.x)
                .attr("data-row", k.y)
                .attr("cx", function(d) { return scatterplot.x[k.x](d[k.x]); })
                .attr("cy", function(d) { return scatterplot.y[k.y](d[k.y]); })
                .attr("r", 2)
                .style("fill", scatterplot.settings.color)
                .style("fill-opacity", ".7")
                .on("mouseover", function(d,i){
                    scatterplot.event.datamouseover(d,i);
                })
                .on("mouseout", function(d,i){
                    scatterplot.event.datamouseout(d,i);
                })
                .on("click", function(d,i){
                    scatterplot.event.dataclick(d,i);
                });
            cell.selectAll("circle.dataPoints")
                .data(scatterplot.d)
                .attr("cx", function(d) { return scatterplot.x[k.x](d[k.x]); })
                .attr("cy", function(d) { return scatterplot.y[k.y](d[k.y]); })
                .style("fill", scatterplot.settings.color);
            cell.selectAll("circle.dataPoints")
                .data(scatterplot.d).exit().remove();

        }

        let scatterGroups = this.foreground.selectAll("g.cellGroup").data(crossed);


        scatterGroups.exit().remove();

        scatterGroups
            .attr("transform", (d) => {
                return "translate(" +
                    d.i * (this.cellWidth+this.settings.innerPadding)
                    + "," + d.j * (this.cellHeight+this.settings.innerPadding) + ")";
            })
            .each(redrawDataPoints);

        let scatterGroupEnter = scatterGroups.enter()
            .append("g")
            .attr("class", "cellGroup")
            .attr("transform", (d) => {
                return "translate(" +
                    d.i * (this.cellWidth+this.settings.innerPadding)
                    + "," + d.j * (this.cellHeight+this.settings.innerPadding) + ")";
            })
            .each(redrawDataPoints);


        scatterGroupEnter.append("rect")
            .attr("class", "frame")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", scatterplot.cellWidth)
            .attr("height", scatterplot.cellHeight)
            .style("fill", "none")
            .style("stroke", "#aaa");

        scatterGroups
            .selectAll("rect.frame")
            .attr("width", scatterplot.cellWidth)
            .attr("height", scatterplot.cellHeight);

        scatterGroupEnter
            .filter(function(d) { return d.i === d.j; })
            .append("text")
            .attr("class", "axisLabel")
            .attr("x", scatterplot.settings.innerPadding)
            .attr("y", scatterplot.settings.innerPadding)
            .attr("dy", ".71em")
            .text(function(d) { return d.x; });
        scatterGroups
            .selectAll("text.axisLabel")
            .text(function(d) { return d.x; });


        // this.foreground.selectAll("g.cellGroup").selectAll("text.axisLabel").remove();
        // this.foreground.selectAll("g.cellGroup")
        //     .filter(function(d) { return d.i === d.j; })
        //     .append("text")
        //     .attr("class", "axisLabel")
        //     .attr("x", scatterplot.settings.innerPadding)
        //     .attr("y", scatterplot.settings.innerPadding)
        //     .attr("dy", ".71em")
        //     .text(function(d) { return d.x; });

        this.foreground.selectAll(".x.axis").remove();
        this.foreground.selectAll(".x.axis")
            .data(this.keys)
            .enter().append("g")
            .attr("class", "x axis")
            .attr("transform", (d, i) => { return "translate("
                + i * (this.cellWidth+this.settings.innerPadding)
                + "," + ($(this.svg[0][0]).height()-this.settings.paddingBottom-this.settings.paddingTop) +")"; })
            .each(function(d) {
                scatterplot.xAxis.scale(scatterplot.x[d]);
                d3.select(this).call(scatterplot.xAxis);
            });

        this.foreground.selectAll(".y.axis").remove();
        this.foreground.selectAll(".y.axis")
            .data(this.keys)
            .enter().append("g")
            .attr("class", "y axis")
            .attr("transform", (d, i) => { return "translate(0," + i * (this.cellHeight+this.settings.innerPadding) + ")"; })
            .each(function(d) {
                scatterplot.yAxis.scale(scatterplot.y[d]);
                d3.select(this).call(scatterplot.yAxis);
            });

    }

    highlight(...args){
        if(typeof args[1] === "number" && args[1] >= 0 && args[1] < this.d.length){
            // this.foreground.select
            // d3.select(args[0])
            let strObj = {}, isFirst = {};
            for(let k of this.keys){
                strObj[k] = "M ";
                isFirst[k] = true;
            }

            this.foreground.selectAll('circle.dataPoints[data-index="'+args[1]+'"]').style("stroke", this.settings.highlightColor)
                .each(function(){
                    let circle = d3.select(this);
                    let t = d3.transform(d3.select(this.parentElement).attr("transform"));
                    if(isFirst[circle.attr("data-row")]){
                        strObj[circle.attr("data-row")] +=
                            (parseFloat(circle.attr("cx")) + t.translate[0])
                            +" "+(parseFloat(circle.attr("cy")) + t.translate[1]);
                        isFirst[circle.attr("data-row")] = false;
                    }else{
                        strObj[circle.attr("data-row")] += " Q "+
                            + t.translate[0]+ " " + t.translate[1]
                            + " , " + (parseFloat(circle.attr("cx")) + t.translate[0])
                            + " " +(parseFloat(circle.attr("cy")) + t.translate[1]);
                    }


                });

            this.background
                .selectAll("path.lineHighlight")
                .data(_.values(strObj)).enter()
                .append("path")
                .attr("class", "lineHighlight")
                .style("fill", "none")
                .style("stroke", this.settings.highlightColor)
                .attr("d", function(d) { return d; })
        }
        super.highlight.apply(this, args);
    }
    removeHighlight(...args){
        if(typeof args[1] === "number" && args[1] >= 0 && args[1] < this.d.length){
            this.foreground.selectAll('circle.dataPoints[data-index="'+args[1]+'"]').style("stroke", "none");
            this.background.selectAll(".lineHighlight").remove();
        }
        super.removeHighlight.apply(this, args);
    }
    getHighlightElement(i){
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        d3.select(group).attr("class", "groupHighlight");
        let strObj = {}, isFirst = {};
        for(let k of this.keys){
            strObj[k] = "M ";
            isFirst[k] = true;
        }

        this.foreground.selectAll('circle.dataPoints[data-index="'+i+'"]')
            .each(function(){
                let circle = d3.select(this);
                let t = d3.transform(d3.select(this.parentElement).attr("transform"));
                if(isFirst[circle.attr("data-row")]){
                    strObj[circle.attr("data-row")] +=
                        (parseFloat(circle.attr("cx")) + t.translate[0])
                        +" "+(parseFloat(circle.attr("cy")) + t.translate[1]);
                    isFirst[circle.attr("data-row")] = false;
                }else{
                    strObj[circle.attr("data-row")] += " Q "+
                        + t.translate[0]+ " " + t.translate[1]
                        + " , " + (parseFloat(circle.attr("cx")) + t.translate[0])
                        + " " +(parseFloat(circle.attr("cy")) + t.translate[1]);
                }


            });

        for(let d of _.values(strObj)){
            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            d3.select(path)
                .attr("class", "lineHighlight")
                .style("fill", "none")
                .style("stroke", this.settings.highlightColor)
                .attr("d", d);
            group.appendChild(path);
        }
        return group;
    }

    static cross(a, b) {
        let c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
        return c;
    }

}

class BeeswarmPlot extends Visualization{

    constructor(parentElement, settings){
        super(parentElement, settings);
        this.settings.innerPadding = settings? settings.innerPadding || 10 : 10;
        this.settings.radius = settings? settings.radius || 2 : 2;
        this.name = "BeeswarmPlot";

        this.xAxis = d3.svg.axis().orient("bottom");
        this.yAxis = d3.svg.axis().orient("right").innerTickSize(0);
        let pl = this.settings.paddingLeft;
        let pr = this.settings.paddingRight;

        this.x = d3.scale.ordinal()
    }

    resize(){
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        let pl = this.settings.paddingLeft;
        let pr = this.settings.paddingRight;
        let ip = this.settings.innerPadding;

        this.boxWidth = ($(this.svg[0][0]).width()-pl-pr-ip*(this.keys.length-1))/this.keys.length;
        this.innerHeight = $(this.svg[0][0]).height()-pt-pb;

        this.x
            .rangePoints([ this.boxWidth/2, $(this.svg[0][0]).width()-pl-pr-this.boxWidth/2], 0);
        for(let k of this.keys){
            if(this.domainType[k] === "Categorical"){
                this.y[k].rangePoints([this.innerHeight, 0], 0);
            }else{
                this.y[k].range([this.innerHeight, 0]);
            }
        }

        this.xPoints = this.getXfunction();
        this.yPoints = (d, k) => {
            return Math.floor(this.y[k](d[k])/this.binHeight)*this.binHeight;
        };
        this.redraw();
        return this;
    }

    data(d){
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        let pl = this.settings.paddingLeft;
        let pr = this.settings.paddingRight;
        let ip = this.settings.innerPadding;
        super.data(d);

        this.dByAxis = {};
        this.boxWidth = ($(this.svg[0][0]).width()-pl-pr-ip*(this.keys.length-1))/this.keys.length;

        this.innerHeight = $(this.svg[0][0]).height()-pt-pb;

        this.x.domain(this.keys)
            .rangePoints([ this.boxWidth/2, $(this.svg[0][0]).width()-pl-pr-this.boxWidth/2], 0);
        this.y = {};
        for(let k of this.keys){
            if(this.domainType[k] === "Categorical"){
                this.y[k] = d3.scale.ordinal()
                    .domain(this.domain[k])
                    .rangePoints([this.innerHeight, 0], 0);
            }else{
                this.y[k] = d3.scale.linear()
                    .domain(this.domain[k])
                    .range([this.innerHeight, 0]);
            }

            // this.dByAxis[k] = this.d.map((d) => { return _.pick(d, k); });
        }


        this.pointXmethod = "center";
        this.xPoints = this.getXfunction();
        this.yPoints = (d, k) => {
            return Math.floor(this.y[k](d[k])/this.binHeight)*this.binHeight;
        };

    }


    redraw(){


        let t0 = performance.now();

        let posWoutColl = (ccx, ccy, cy, dd, sign) => { return ccx + sign*Math.sqrt(dd - (ccy-cy)*(ccy-cy)); };

        //Atualiza os Eixos
        let beeswarm = this;


        function redrawDataPoints (k){
            beeswarm.resetXfunction();

            let dataSelection = d3.select(this)
                .selectAll("circle.dataPoint")
                .data(beeswarm.d);

            dataSelection.exit().remove();
            dataSelection.enter()
                .append("circle")
                .attr("class", "dataPoint")
                .attr("data-index", function(d, i){ return i; })
                .style("fill-opacity", ".6")
                .on("mouseover", (d,i) =>{ beeswarm.event.datamouseover(d,i); })
                .on("mouseout", (d,i) =>{ beeswarm.event.datamouseout(d,i); })
                .on("click", (d,i) =>{ beeswarm.event.dataclick(d,i); })

                .attr("cx", (d) => { return beeswarm.xPoints(d, k); })
                .attr("cy", (d) => { return beeswarm.yPoints(d, k); })
                .style("fill", beeswarm.settings.color)
                .attr("r", beeswarm.settings.radius);

            dataSelection
                .attr("cx", (d) => { return beeswarm.xPoints(d, k); })
                .attr("cy", (d) => { return beeswarm.yPoints(d, k); })
                .style("fill", beeswarm.settings.color);
        }

        console.log(this.keys);
        let beegroup = this.foreground.selectAll("g.beeSwarmGroup")
            .data(this.keys);

        beegroup.exit().remove();
        let beegroupenter = beegroup.enter()
            .append("g")
            .attr("class", "beeSwarmGroup")
            .attr("transform", (d) => {
                return "translate(" + this.x(d) + ",0)";
            })
            .each(redrawDataPoints);
        beegroup
            .attr("transform", (d) => {
                return "translate(" + this.x(d) + ",0)";
            });

        beegroupenter.append("rect")
            .attr("class", "frame")
            .attr("x", -beeswarm.boxWidth/2)
            .attr("y", 0)
            .attr("width", beeswarm.boxWidth)
            .attr("height", $(beeswarm.svg[0][0]).height()
                -beeswarm.settings.paddingTop-beeswarm.settings.paddingBottom)
            .style("fill", "none")
            .style("stroke", "#aaa");
        beegroupenter.append("g")
            .attr("class", "axis")
            .attr("transform", "translate("+(-beeswarm.boxWidth/2)+",0)")
            .each(function(k) { d3.select(this).call(beeswarm.yAxis.scale(beeswarm.y[k])); });
        beegroupenter.append("text")
            .attr("class", "axisLabel")
            .attr("x", 0)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .text(function(d){
                return d;
            });

        beegroupenter.each(function(k){
            console.log("enter: "+k);
        });
        // beegroup.selectAll("")
        beegroup
            .each(function(k) {
                d3.select(this).selectAll("g.axis").call(beeswarm.yAxis.scale(beeswarm.y[k]));
            })
            .selectAll("g.axis")
            .attr("transform", "translate("+(-beeswarm.boxWidth/2)+",0)");

        beegroup
            .each(redrawDataPoints)
            .selectAll(".frame")
            .attr("x", -beeswarm.boxWidth/2)
            .attr("y", 0)
            .attr("width", beeswarm.boxWidth)
            .attr("height", $(beeswarm.svg[0][0]).height()
                -beeswarm.settings.paddingTop-beeswarm.settings.paddingBottom);

        beegroup
            .each(function(d){
                d3.select(this).selectAll("text.axisLabel").text(d);
            });


        let t1 = performance.now();
        console.log("TIme: "+(t1-t0));
    }

    highlight(...args){
        let beeswarm = this;
        let pl = this.settings.paddingLeft;
        if(args[0] instanceof SVGElement){

        }else if(typeof args[1] === "number" && args[1] >= 0 && args[1] < this.d.length){
            // this.foreground.select
            // d3.select(args[0])
            let str = "M ";
            this.foreground.selectAll('circle[data-index="'+args[1]+'"]').style("stroke", this.settings.highlightColor)
                .each(function(){
                    let circle = d3.select(this);
                    let t = d3.transform(d3.select(this.parentElement).attr("transform"));
                    str += (parseFloat(circle.attr("cx")) + t.translate[0])
                        +","+circle.attr("cy") + " L "
                });
            str = str.substring(0, str.length - 3);
            this.background
                .append("path")
                .attr("class", "lineHighlight")
                .style("fill", "none")
                .style("stroke", this.settings.highlightColor)
                .attr("d", str)
        }
        super.highlight.apply(this, args);
    }
    removeHighlight(...args){
        if(args[1] instanceof SVGElement){

        }else if(typeof args[1] === "number" && args[1] >= 0 && args[1] < this.d.length){
            this.foreground.selectAll('circle[data-index="'+args[1]+'"]').style("stroke", "none");
            this.background.selectAll(".lineHighlight").remove();
        }
        super.removeHighlight.apply(this, args);
    }
    getHighlightElement(i){
        let str = "M ";
        this.foreground.selectAll('circle[data-index="'+i+'"]')
            .each(function(){
                let circle = d3.select(this);
                let t = d3.transform(d3.select(this.parentElement).attr("transform"));
                str += (parseFloat(circle.attr("cx")) + t.translate[0])
                    +","+circle.attr("cy") + " L "
            });
        str = str.substring(0, str.length - 3);

        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        d3.select(group).attr("class", "groupHighlight");
        let path = d3.select(document.createElementNS("http://www.w3.org/2000/svg", "path"))
            .attr("class", "lineHighlight")
            .style("fill", "none")
            .style("stroke", this.settings.highlightColor)
            .attr("d", str).node();
        group.appendChild(path);
        return group;
    }


    getXfunction(){
        switch (this.pointXmethod){
            case "center":
                let binQuant = Math.floor(this.innerHeight/(this.settings.radius*2));
                this.binHeight = this.innerHeight/binQuant;
                let hist = {};
                this.initXPos ={};
                this.xPos ={};

                for(let k of this.keys){
                    hist[k] = [];
                    this.initXPos[k] = [];
                    this.xPos[k] = [];
                    for(let i=0;i<=binQuant;i++)
                        hist[k][i] = 0;
                    for(let d of this.d)
                        hist[k][Math.floor(this.y[k](d[k])/this.binHeight)]++;


                    for(let i=0;i<hist[k].length;i++){
                        this.initXPos[k][i] = -hist[k][i]*this.settings.radius + this.settings.radius;
                        this.xPos[k][i] = this.initXPos[k][i];
                    }
                    console.log(k, binQuant, hist[k].length, this.xPos[k][this.xPos[k].length-1], this.xPos[k]);
                }
                return (d, k) => {
                    let i = Math.floor(this.y[k](d[k])/this.binHeight);
                    let xpos = this.xPos[k][i];
                    this.xPos[k][i] += this.settings.radius*2;
                    return xpos;
                };
        }
    }
    resetXfunction(){
        for(let k of this.keys)
            for (let i = 0; i < this.initXPos[k].length; i++)
                this.xPos[k][i] = this.initXPos[k][i];
    }

}


class QuadTree{

    constructor(){
        this.root = {};
    }

    insert(bound, node){
        let _insert = function (root, bound, node) {
            if(root.isLeaf){
                let brother = {isLeaf:true, bound: root.bound, node: root.node};
                let inserted = {isLeaf:true, bound: bound, node: node};
                root.bound = QuadTree.unionBound(brother.bound, bound);
                root.isLeaf = false;
                root.node = undefined;
                root.child1 = brother;
                root.child2 = inserted;
                return root.bound;
            }else{
                let mb1 = QuadTree.unionBound(root.child1.bound, bound);
                let mb2 = QuadTree.unionBound(root.child2.bound, bound);
                let resultBound;
                if(QuadTree.boundArea(mb1) > QuadTree.boundArea(mb2)){
                    resultBound = _insert(root.child2, bound, node);
                }else{
                    resultBound = _insert(root.child1, bound, node);
                }
                root.bound = QuadTree.unionBound(root.bound, resultBound);
                return root.bound;
            }
        };
        if(!this.root.bound){
            this.root.bound = bound;
            this.root.node = node;
            this.root.isLeaf = true;
        }else{
            _insert(this.root, bound, node);
        }
    }

    getCollisions(bound){

        let _getCollisions = (root, bound, array) => {
            if(QuadTree.isColliding(root.bound, bound)){
                if(root.isLeaf){
                    array.push(root.node);
                }else{
                    _getCollisions(root.child1, bound, array);
                    _getCollisions(root.child2, bound, array);
                }
            }
        };

        if(this.root.bound){
            let collisions = [];
            _getCollisions(this.root, bound, collisions);
            return collisions;
        }
        return [];
    }

    static unionBound(b1, b2){
        return {
            x1: Math.min(b1.x1, b2.x1),
            y1: Math.min(b1.y1, b2.y1),
            x2: Math.max(b1.x2, b2.x2),
            y2: Math.max(b1.y2, b2.y2)
        };
    }
    static boundArea(b){
        return (b.x2-b.x1)*(b.y2-b.y1);
    }
    static isColliding(b1, b2){
        return !(b2.x1 > b1.x2 ||
            b2.x2 < b1.x1 ||
            b2.y1 > b1.y2 ||
            b2.y2 < b1.y1);
    }
}

var vis = {
    "Visualization": Visualization,
    "ParallelCoordinates": ParallelCoordinates,
    "ScatterplotMatrix": ScatterplotMatrix,
    "BeeswarmPlot": BeeswarmPlot
};

exports.vis = vis;