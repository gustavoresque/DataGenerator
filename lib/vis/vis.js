

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
            paddingBottom: 20
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

        this.parentElement.__vis__ = this;

    }


    data(d){
        this.d = d;
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
        this.canvas = this.svg.append("g");
        this.background = this.canvas.append("g")
            .attr("class", "background")
            .attr("transform", "translate("+this.settings.paddingLeft+","+this.settings.paddingTop+")");

        // Add blue foreground lines for focus.
        this.foreground = this.canvas.append("g")
            .attr("class", "foreground")
            .attr("transform", "translate("+this.settings.paddingLeft+","+this.settings.paddingTop+")");

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
        return this;
    }

    data(d){
        let pt = this.settings.paddingTop;
        let pb = this.settings.paddingBottom;
        super.data(d);

        this.keys = [];
        this.y = {};
        for(let k in this.d[0]){
            if(this.d[0].hasOwnProperty(k)){
                this.keys.push(k);
                if(isNaN(+this.d[0][k])) {
                    this.y[k] = d3.scale.ordinal()
                        .domain(_.uniq(_.pluck(this.d, k)))
                        .rangePoints([$(this.svg[0][0]).height()-pt-pb, 0], 0);
                } else {
                                        this.y[k] =  d3.scale.linear()
                        .domain(d3.extent(this.d, (obj) => {return obj[k]}))
                        .range([$(this.svg[0][0]).height()-pt-pb, 0]);
                }
            }
        }
        this.x.domain(this.keys);


    }


    redraw(){

        let dataid = (d) => {return d;};
        let axis = d3.svg.axis().orient("left");
        //Atualiza os Eixos
        let y_axes = this.y;



        this.foreground.selectAll("path.data")
            .data(this.d)
            .enter()
            .append("path")
            .each((d)=>{console.log("insert",d);})
            .attr("class", "data")
            .attr("d", this.lineFunction)
            .style("stroke", this.settings.color);
        this.foreground.selectAll("path.data")
            .data(this.d)
            .each((d)=>{console.log("update",d);})
            .attr("d", this.lineFunction)
            .style("stroke", this.settings.color);
        this.foreground.selectAll("path.data")
            .data(this.d)
            .exit()
            .each((d)=>{console.log("remove",d);})
            .remove();

        this.foreground.selectAll(".axis")
            .data(this.keys, dataid)
            .exit().remove();
        this.axis = this.foreground.selectAll(".axis")
            .data(this.keys, dataid)
            .attr("transform", (d) => { return "translate(" + this.x(d) + ")"; })
            .each(function(d) { d3.select(this).call(axis.scale(y_axes[d])); });
        this.axis = this.foreground.selectAll(".axis")
            .data(this.keys, dataid)
            .enter()
            .append("g")
            .attr("class", "axis")
            .attr("transform", (d) => { return "translate(" + this.x(d) + ")"; })
            .each(function(d) { d3.select(this).call(axis.scale(y_axes[d])); });

        // Add an axis and title.
        this.axis.append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(function(d) { return d; });


    }

}


var vis = {
    "Visualization": Visualization,
    "ParallelCoordinates": ParallelCoordinates
};