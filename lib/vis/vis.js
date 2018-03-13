

class Visualization {

    constructor(parentElement, settings){
        //default configuration
        this.parentElement = parentElement;
        console.log(this.parentElement);
        this.settings = {
            color: "#069",
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


        this.event = d3.dispatch("brush", "draw");

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

        this.parentElement.__vis__ = this;

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
                    this.domain[k] = _.uniq(_.pluck(this.d, k));
                    this.domainType[k] = "Categorical";
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

}


class ParallelCoordinates extends Visualization{

    constructor(parentElement, settings){
        super(parentElement, settings);

        this.lineFunction = (d) => {
            return d3.svg.line()(this.keys.map((key) => { return [this.x(key), this.y[key](d[key])]; }))
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
            for (let prop in this.y) {
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

        this.y = {};
        for(let k of this.keys){
            if(this.domainType === "Categorical") {
                this.y[k] = d3.scale.ordinal()
                    .domain(this.domain[k])
                    .rangePoints([$(this.svg[0][0]).height()-pt-pb, 0], 0);
            } else {
                this.y[k] =  d3.scale.linear()
                    .domain(this.domain[k])
                    .range([$(this.svg[0][0]).height()-pt-pb, 0]);
            }
        }
        this.x.domain(this.keys);

    }


    redraw(){

        if(!this.hasData)
            return;

        let axis = d3.svg.axis().orient("left");
        //Atualiza os Eixos
        let y_axes = this.y;



        this.foreground.selectAll("path.data")
            .data(this.d)
            .enter()
            .append("path")
            .attr("class", "data")
            .attr("d", this.lineFunction)
            .style("stroke", this.settings.color);
        this.foreground.selectAll("path.data")
            .data(this.d)
            .attr("d", this.lineFunction)
            .style("stroke", this.settings.color);
        this.foreground.selectAll("path.data")
            .data(this.d)
            .exit()
            .remove();

        this.foreground.selectAll(".axis")
            .data(this.keys)
            .exit().remove();
        this.axis = this.foreground.selectAll(".axis")
            .data(this.keys)
            .attr("transform", (d) => { return "translate(" + this.x(d) + ")"; })
            .each(function(d) { d3.select(this).call(axis.scale(y_axes[d])); });
        this.axis.select("text.column_label")
            .text(function(d) { return d; });

        this.axis = this.foreground.selectAll(".axis")
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

}

class ScatterplotMatrix extends Visualization{

    constructor(parentElement, settings){
        super(parentElement, settings);
        this.settings.innerPadding = settings? settings.innerPadding || 8 : 8;


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
                this.x[k] = d3.scale
                    .domain(this.domain[k])
                    .rangePoints([0, this.cellWidth], 0);
                this.y[k] = d3.scale
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

        this.foreground.selectAll("g.cellGroup").data(crossed).exit().remove();

        this.foreground.selectAll("g.cellGroup")
            .data(crossed)
            .attr("transform", (d) => {
                return "translate(" +
                    d.i * (this.cellWidth+this.settings.innerPadding)
                    + "," + d.j * (this.cellHeight+this.settings.innerPadding) + ")";
            })
            .each(function(k){
                let cell = d3.select(this);
                cell.select("rect.frame")
                    .attr("width", scatterplot.cellWidth)
                    .attr("height", scatterplot.cellHeight);

                cell.selectAll("circle.dataPoints")
                    .data(scatterplot.d).enter()
                    .append("circle")
                    .attr("class", "dataPoints")
                    .attr("cx", function(d) { return scatterplot.x[k.x](d[k.x]); })
                    .attr("cy", function(d) { return scatterplot.y[k.y](d[k.y]); })
                    .attr("r", 4)
                    .style("fill", scatterplot.settings.color)
                    .style("fill-opacity", ".7");
                cell.selectAll("circle.dataPoints")
                    .data(scatterplot.d)
                    .attr("cx", function(d) { return scatterplot.x[k.x](d[k.x]); })
                    .attr("cy", function(d) { return scatterplot.y[k.y](d[k.y]); })
                    .style("fill", scatterplot.settings.color);
                cell.selectAll("circle.dataPoints")
                    .data(scatterplot.d).exit().remove();

            });

        this.foreground.selectAll("g.cellGroup")
            .data(crossed).enter()
            .append("g")
            .attr("class", "cellGroup")
            .attr("transform", (d) => {
                return "translate(" +
                    d.i * (this.cellWidth+this.settings.innerPadding)
                    + "," + d.j * (this.cellHeight+this.settings.innerPadding) + ")";
            })
            .each(function (k) {

                let cell = d3.select(this);
                cell.append("rect")
                    .attr("class", "frame")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", scatterplot.cellWidth)
                    .attr("height", scatterplot.cellHeight)
                    .style("fill", "none")
                    .style("stroke", "#aaa");

                cell.selectAll("circle.dataPoints")
                    .data(scatterplot.d).enter()
                    .append("circle")
                    .attr("class", "dataPoints")
                    .attr("cx", function(d) { return scatterplot.x[k.x](d[k.x]); })
                    .attr("cy", function(d) { return scatterplot.y[k.y](d[k.y]); })
                    .attr("r", 4)
                    .style("fill", scatterplot.settings.color)
                    .style("fill-opacity", ".7");

            });

        this.foreground.selectAll("g.cellGroup").selectAll("text.axisLabel").remove();
        this.foreground.selectAll("g.cellGroup")
            .filter(function(d) { return d.i === d.j; })
            .append("text")
            .attr("class", "axisLabel")
            .attr("x", scatterplot.settings.innerPadding)
            .attr("y", scatterplot.settings.innerPadding)
            .attr("dy", ".71em")
            .text(function(d) { return d.x; });

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

    static cross(a, b) {
        let c = [], n = a.length, m = b.length, i, j;
        for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
        return c;
    }

}

var vis = {
    "Visualization": Visualization,
    "ParallelCoordinates": ParallelCoordinates,
    "ScatterplotMatrix": ScatterplotMatrix
};