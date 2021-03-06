let ctrlKey = false;
let shiftKey = false;

$(document).keydown(function(e){
    if (e.ctrlKey)
    {
        ctrlKey = true;
    }
    else ctrlKey = false;

    if (e.shiftKey)
    {
        shiftKey = true;
    }
    else shiftKey = false;
});

$(document).keyup(function(e){

    if (ctrlKey)
    {
        ctrlKey = false;
    }

    if (shiftKey)
    {
        shiftKey = false;
    }
});

class Point{
    constructor(_x, _y,){
        this.x = _x;
        this.y = _y;
    }
}
class Drawing{
    constructor(_points, _id, _globalUpdate, _getAllPath){
        let pointsList = [];
        let pointsInDomainList = [];

        _points.forEach(function(e,i){
            let p = new Point(e[0],e[1]);
            pointsList.push(p);

            let pd = new Point(xScale.invert(e[0]),yScale.invert(e[1]));
            pointsInDomainList.push(pd);
        });

        this.points = pointsList; //Points in range, position on the screen
        this.pointsInDomain = pointsInDomainList;//Points in domain, position relative to scale
        this.id = _id;
        this.globalUpdate = _globalUpdate;
        this.getAllPath = _getAllPath;
    }

    updatePointsPosition(){
        this.points.forEach((e,i)=>{
            this.points[i] = new Point(xScale(this.pointsInDomain[i].x), yScale(this.pointsInDomain[i].y));
        });
    }
}

class Line extends Drawing{
    drawPath(){

    }

    getPath(){
        return "M "+this.points[0].x+","+this.points[0].y+" L"+this.points[1].x+","+this.points[1].y;
    }
}

class Circle extends Drawing{
    constructor(options){
        super(options._points, options._id, options._globalUpdate, options._getAllPath);
        if (options._radius)
            this.radius = options._radius;
        else
            this.radius = Math.sqrt(Math.pow((this.points[1].x - this.points[0].x),2) + Math.pow((this.points[1].y - this.points[0].y),2));
    }

    circlePoints(){
        let bezierPoints = [];
        let center = this.points[0];
        let aux = this.radius * 0.5;

        bezierPoints.push([center.x - this.radius, center.y]);
        bezierPoints.push([center.x - this.radius, center.y + aux]);

        bezierPoints.push([center.x - aux, center.y + this.radius]);
        bezierPoints.push([center.x, center.y + this.radius]);
        bezierPoints.push([center.x + aux, center.y + this.radius]);

        bezierPoints.push([center.x + this.radius, center.y + aux]);
        bezierPoints.push([center.x + this.radius, center.y]);
        bezierPoints.push([center.x + this.radius, center.y - aux]);

        bezierPoints.push([center.x + aux, center.y - this.radius]);
        bezierPoints.push([center.x, center.y - this.radius]);
        bezierPoints.push([center.x - aux, center.y - this.radius]);

        bezierPoints.push([center.x - this.radius, center.y - aux]);
        bezierPoints.push([center.x - this.radius, center.y]);

        return bezierPoints;
    }

    drawPath (){
        // let g = d3.select('g').insert('g');
        // $(g).get(0).__node__ = this;
        // let thisDrawingProperties = $(g).get(0).__node__;
    }

    getPath(){
        /*<circle cx="100" cy="100" r="75" />

    <path d="
        M 100, 100
        m -75, 0
        a 75,75 0 1,0 150,0
        a 75,75 0 1,0 -150,0
    "/>*/
        /*<path d="
            M cx, cy
            m -r, 0
            a r,r 0 1,0 (r * 2),0
            a r,r 0 1,0 -(r * 2),0
        "/>*/
        let str =  "M " + this.points[0].x + ", " + this.points[0].y +
            " M " + (this.points[0].x-this.radius) + ", " + this.points[0].y +
            " A " + this.radius + ", " + this.radius + " 0 1,0 " + (this.points[0].x+(this.radius)) + ", " + this.points[0].y +
            " A " + this.radius + ", " + this.radius + " 0 1,0 " + (this.points[0].x-(this.radius)) + ", " + this.points[0].y;
        return str;
    }
}

class Bezier extends Drawing{
    constructor(_points, _id, _cycle, _globalUpdate, _getAllPath){
        super(_points, _id, _globalUpdate, _getAllPath);
        this.cycle = _cycle;
    }

    drawPath(){
        let g = d3.select('g').insert('g');
        $(g).get(0).__node__ = this;
        let thisDrawingProperties = $(g).get(0).__node__;
        let str = '';

        if (this.points.length > 0){//Primeiro ponto
            str = "M "+this.points[0].x+","+this.points[0].y+" C";

            let line;
            let middle = this.points[0], anchor1 = this.points[1];
            line = "M "+middle.x+","+middle.y+" L"+anchor1.x+","+anchor1.y;

            g.append('path').attr("class", "lineGuide").attr("d",line)
                .style("stroke","red").style("stroke-width","1px");
        }
        for(let i=1; i<this.points.length; i++){//Pontos do meio
            str += " "+this.points[i].x+","+this.points[i].y;

            if (i%3 === 0 && i<this.points.length-1){
                let line;
                let middle = this.points[i], anchor1 = this.points[i+1], anchor2 = this.points[i-1];
                line = "M "+middle.x+","+middle.y+" L"+anchor1.x+","+anchor1.y;
                line += "M "+anchor2.x+","+anchor2.y+" L"+middle.x+","+middle.y;

                g.append('path').attr("class", "lineGuide").attr("d",line)
                    .style("stroke","red").style("stroke-width","1px");
            }

            if (i === this.points.length-1){//Último ponto
                let line;
                let middle = this.points[this.points.length-1], anchor1 = this.points[this.points.length-2];
                line = "M "+middle.x+","+middle.y+" L"+anchor1.x+","+anchor1.y;

                g.append('path').attr("class", "lineGuide").attr("d",line)
                    .style("stroke","red").style("stroke-width","1px");
            }
        }

        g.append('path').attr("class", "definitive").attr("id", this.id).attr("d",str)
            .style("fill","none").style("stroke","black").style("stroke-width","3px");

        let distance = 0;
        let theta_radians = 0;

        g.selectAll("circle.control")
            .data(this.points)
            .enter().append(function(d,i){
                if (i % 3 === 0){
                    return document.createElementNS('http://www.w3.org/2000/svg', "circle");
                } else {
                    return document.createElementNS('http://www.w3.org/2000/svg', "rect");
                }
            })
            .call(d3.drag()
                .on("start", function(d,i) {
                    console.log(i);
                    let delta_x = 0;
                    let delta_y = 0;
                    if (thisDrawingProperties.points[i-1]){
                        distance = Math.sqrt(Math.pow((thisDrawingProperties.points[i-1].x - thisDrawingProperties.points[i].x),2) + Math.pow((thisDrawingProperties.points[i-1].y - thisDrawingProperties.points[i].y),2));

                        delta_x = thisDrawingProperties.points[i-1].x - thisDrawingProperties.points[i].x;
                        delta_y = thisDrawingProperties.points[i-1].y - thisDrawingProperties.points[i].y;
                    }
                    else{
                        distance = Math.sqrt(Math.pow((thisDrawingProperties.points[i].x - thisDrawingProperties.points[i+1].x),2) + Math.pow((thisDrawingProperties.points[i].y - thisDrawingProperties.points[i+1].y),2));

                        delta_x = thisDrawingProperties.points[i].x - thisDrawingProperties.points[i+1].x;
                        delta_y = thisDrawingProperties.points[i].y - thisDrawingProperties.points[i+1].y;
                    }
                    theta_radians = Math.atan2(delta_y, delta_x);
                })
                .on("drag", function(d,i) {
                    g.selectAll(".lineGuide").remove();
                    if(distance < 1 && !ctrlKey){
                        let t = i;
                        if(i % 3 === 1){
                            t = i-1;
                        }else if(i % 3 === 2) {
                            t = i + 1;
                        }
                        if (thisDrawingProperties.cycle && i === thisDrawingProperties.points.length - 1){
                            console.log("Teste");
                            thisDrawingProperties.points[thisDrawingProperties.points.length - 1].x = d3.mouse(document.getElementById("canvas"))[0];
                            thisDrawingProperties.points[thisDrawingProperties.points.length - 1].y = d3.mouse(document.getElementById("canvas"))[1];
                            thisDrawingProperties.points[0].x = d3.mouse(document.getElementById("canvas"))[0];
                            thisDrawingProperties.points[0].y = d3.mouse(document.getElementById("canvas"))[1];

                            let x3 = thisDrawingProperties.points[t].x + (distance * Math.cos(theta_radians));
                            let y3 = thisDrawingProperties.points[t].y + (distance * Math.sin(theta_radians));
                            thisDrawingProperties.points[t-1] = new Point(x3,y3);
                        }else{
                            thisDrawingProperties.points[t].x = d3.mouse(document.getElementById("canvas"))[0];
                            thisDrawingProperties.points[t].y = d3.mouse(document.getElementById("canvas"))[1];

                            let x3 = thisDrawingProperties.points[t].x + (distance * Math.cos(theta_radians));
                            let y3 = thisDrawingProperties.points[t].y + (distance * Math.sin(theta_radians));
                            thisDrawingProperties.points[t-1] = new Point(x3,y3);
                        }

                        if(t+1 < thisDrawingProperties.points.length) thisDrawingProperties.points[t+1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[t].x, thisDrawingProperties.points[t].y, thisDrawingProperties.points[t-1].x, thisDrawingProperties.points[t-1].y);
                    }else{
                        thisDrawingProperties.points[i].x = d3.mouse(document.getElementById("canvas"))[0];
                        thisDrawingProperties.points[i].y = d3.mouse(document.getElementById("canvas"))[1];
                        if (thisDrawingProperties.cycle && i === thisDrawingProperties.points.length-1){
                            thisDrawingProperties.points[0].x = d3.mouse(document.getElementById("canvas"))[0];
                            thisDrawingProperties.points[0].y = d3.mouse(document.getElementById("canvas"))[1];
                        }

                        if (shiftKey) {
                            let j = 0;
                            if (thisDrawingProperties.cycle && i === thisDrawingProperties.points.length - 2){
                                thisDrawingProperties.points[j + 1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[j].x, thisDrawingProperties.points[j].y, thisDrawingProperties.points[i].x, thisDrawingProperties.points[i].y);
                            }else if (thisDrawingProperties.cycle && i === 1){
                                j = thisDrawingProperties.points.length - 1;
                                thisDrawingProperties.points[j - 1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[j].x, thisDrawingProperties.points[j].y, thisDrawingProperties.points[i].x, thisDrawingProperties.points[i].y);
                            }else if (i % 3 === 1) {
                                j = i - 1;
                                thisDrawingProperties.points[j - 1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[j].x, thisDrawingProperties.points[j].y, thisDrawingProperties.points[i].x, thisDrawingProperties.points[i].y);
                            } else if (i % 3 === 2) {
                                j = i + 1;
                                if (j + 1 < thisDrawingProperties.points.length) thisDrawingProperties.points[j + 1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[j].x, thisDrawingProperties.points[j].y, thisDrawingProperties.points[i].x, thisDrawingProperties.points[i].y);
                            }
                        }
                        if (i % 3 === 0) {
                            let x3 = thisDrawingProperties.points[i].x + (distance * Math.cos(theta_radians));
                            let y3 = thisDrawingProperties.points[i].y + (distance * Math.sin(theta_radians));
                            thisDrawingProperties.points[i - 1] = new Point(x3, y3);

                            if (i+1 < thisDrawingProperties.points.length){
                                thisDrawingProperties.points[i + 1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[i].x, thisDrawingProperties.points[i].y, thisDrawingProperties.points[i - 1].x, thisDrawingProperties.points[i - 1].y);
                            }
                            else if (thisDrawingProperties.cycle){
                                thisDrawingProperties.points[1] = thisDrawingProperties.pontoOposto(thisDrawingProperties.points[i].x, thisDrawingProperties.points[i].y, thisDrawingProperties.points[i - 1].x, thisDrawingProperties.points[i - 1].y);
                            }
                        }
                    }

                    thisDrawingProperties.globalUpdate();
                })
                .on("end", function(d,i) {
                    let t = i;
                    if(i % 3 === 1){
                        t = i-1;
                    }else if(i % 3 === 2) {
                        t = i + 1;
                    }
                    if (thisDrawingProperties.points[t-1]){
                        distance = Math.sqrt(Math.pow((thisDrawingProperties.points[t-1].x - thisDrawingProperties.points[t].x),2) + Math.pow((thisDrawingProperties.points[t-1].y - thisDrawingProperties.points[t].y),2));
                    }
                    else{
                        distance = Math.sqrt(Math.pow((thisDrawingProperties.points[t].x - thisDrawingProperties.points[t+1].x),2) + Math.pow((thisDrawingProperties.points[t].y - thisDrawingProperties.points[t+1].y),2));
                    }

                    if (distance <= 5){
                        if (thisDrawingProperties.points[t-1]) thisDrawingProperties.points[t-1] = thisDrawingProperties.points[t];
                        if (thisDrawingProperties.points[t+1]) thisDrawingProperties.points[t+1] = thisDrawingProperties.points[t];
                    }
                    thisDrawingProperties.globalUpdate();

                    thisDrawingProperties.pointsInDomain[i] = new Point(xScale.invert(thisDrawingProperties.points[i].x),yScale.invert(thisDrawingProperties.points[i].y));
                    ipc.send('get-path2', thisDrawingProperties.getAllPath());
                }));

        g.selectAll("circle")
            .attr("fill", "black")
            .attr("cx",  function (d) { return d.x; })
            .attr("cy",  function (d) { return d.y; })
            .attr("r", 6);

        g.selectAll("rect")
            .attr("fill", "blue")
            .attr("x", function (d) { return (d.x-4); })
            .attr("y", function (d) { return (d.y-4); })
            .attr("width", 8)
            .attr("height", 8);

        g.attr('class', 'drawing');
        return g.node();
    }

    pontoOposto (x1,y1,x2,y2){
        let x3 = 0, y3 = 0;

        let d = Math.sqrt(Math.pow((x2 - x1),2) + Math.pow((y2 - y1),2));

        let delta_x = x2 - x1;
        let delta_y = y2 - y1;
        let theta_radians = Math.atan2(delta_y, delta_x);

        x3 = x1 + (d * Math.cos(theta_radians - Math.PI));
        y3 = y1 + (d * Math.sin(theta_radians - Math.PI));

        return new Point(x3,y3);
    }

    getPath(){
        let cp_scaled = [];
        let t = [];
        for (let j = 0; j < this.points.length; j++){
            t.push([xScale.invert(this.points[j].x),yScale.invert(this.points[j].y)]);
        }
        cp_scaled.push(t);

        let str = "";
        cp_scaled.forEach((e,i)=>{
            if (e.length > 0){
                str += "M "+e[0][0]+","+e[0][1]+" C";
            }

            for(let i=1; i<e.length; i++){
                str += " "+e[i][0]+","+e[i][1];
            }
        });

        return str;
    }
}

class Spiral extends Drawing{

}

Drawing.listOfDrawings = {
    'Bezier' : Bezier,
    'Circle' : Circle
};

if(module){
    module.exports = Drawing;
}
