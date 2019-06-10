class Point{
    constructor(_x, _y,){
        this.x = _x;
        this.y = _y;
    }
}
class Drawings{
    constructor(_points, _id){
        let pointsList = [];

        _points.forEach(function(e,i){
            let p = new Point(e[0],e[1]);
            pointsList.push(p);
        });

        this.points = pointsList;
        this.id = _id;
    }
}

class Line extends Drawings{
    getPath(){
        return "M "+this.points[0].x+","+this.points[0].y+" L"+this.points[1].x+","+this.points[1].y;
    }
}

class Circle extends Drawings{

}

class Bezier extends Drawings{
    constructor(_points, _id){
        super(_points, _id);
    }

    drawPath(){
        let g = d3.select('g').insert('g');
        $(g).get(0).__node__ = this;
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

        g.append('path').attr("class", "definitive").attr("id", 0).attr("d",str)
            .style("fill","none").style("stroke","black").style("stroke-width","3px");

        let distance = 0;
        let theta_radians = 0;

        g.selectAll("circle.control")
            .data(this.points)
            .enter().append("svg:circle")
            .attr("fill", "blue")
            .attr("r", 3)
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .call(d3.drag()
                .on("start", function(d,i) {
                    let delta_x = 0;
                    let delta_y = 0;
                    if ($(g).get(0).__node__.points[i-1]){
                        distance = Math.sqrt(Math.pow(($(g).get(0).__node__.points[i-1].x - $(g).get(0).__node__.points[i].x),2) + Math.pow(($(g).get(0).__node__.points[i-1].y - $(g).get(0).__node__.points[i].y),2));

                        delta_x = $(g).get(0).__node__.points[i-1].x - $(g).get(0).__node__.points[i].x;
                        delta_y = $(g).get(0).__node__.points[i-1].y - $(g).get(0).__node__.points[i].y;
                    }
                    else{
                        distance = Math.sqrt(Math.pow(($(g).get(0).__node__.points[i].x - $(g).get(0).__node__.points[i+1].x),2) + Math.pow(($(g).get(0).__node__.points[i].y - $(g).get(0).__node__.points[i+1].y),2));

                        delta_x = $(g).get(0).__node__.points[i].x - $(g).get(0).__node__.points[i+1].x;
                        delta_y = $(g).get(0).__node__.points[i].y - $(g).get(0).__node__.points[i+1].y;
                    }
                    theta_radians = Math.atan2(delta_y, delta_x);
                })
                .on("drag", function(d,i) {
                    g.selectAll(".lineGuide").remove();
                    $(g).get(0).__node__.points[i].x = d3.event.x;
                    $(g).get(0).__node__.points[i].y = d3.event.y;

                    let j = 0;
                    if(i % 3 === 1){
                        j = i-1;
                        $(g).get(0).__node__.points[j-1] = $(g).get(0).__node__.pontoOposto($(g).get(0).__node__.points[j].x, $(g).get(0).__node__.points[j].y, $(g).get(0).__node__.points[i].x, $(g).get(0).__node__.points[i].y);
                    }else if(i % 3 === 2){
                        j = i+1;
                        if(j+1 < $(g).get(0).__node__.points.length) $(g).get(0).__node__.points[j+1] = $(g).get(0).__node__.pontoOposto($(g).get(0).__node__.points[j].x, $(g).get(0).__node__.points[j].y, $(g).get(0).__node__.points[i].x, $(g).get(0).__node__.points[i].y);
                    }else{
                        let x3 = $(g).get(0).__node__.points[i].x + (distance * Math.cos(theta_radians));
                        let y3 = $(g).get(0).__node__.points[i].y + (distance * Math.sin(theta_radians));
                        $(g).get(0).__node__.points[i-1] = new Point(x3,y3);

                        if(i+1 < $(g).get(0).__node__.points.length) $(g).get(0).__node__.points[i+1] = $(g).get(0).__node__.pontoOposto($(g).get(0).__node__.points[i].x, $(g).get(0).__node__.points[i].y, $(g).get(0).__node__.points[i-1].x, $(g).get(0).__node__.points[i-1].y);
                    }
                    $(g).get(0).__node__.funcao();
                })
                .on("end", function(d,i) {
                    ipc.send('get-path2', $(g).get(0).__node__.getPath());
                }));

        g.attr('class', 'drawing');
        return g.node();
    }

    setOnStateChange(funcao){
        this.funcao = funcao;
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

class Spiral extends Drawings{

}

if(module){
    module.exports = Bezier;
}