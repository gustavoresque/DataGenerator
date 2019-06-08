class Point{
    constructor(_x, _y){
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

    getPath(){
        let g = d3.select('g').insert('g');
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
                    distance = Math.sqrt(Math.pow((this.points[i-1].x - this.points[i].x),2) + Math.pow((this.points[i-1].y - this.points[i].y),2));

                    let delta_x = this.points[i-1].x - this.points[i].x;
                    let delta_y = this.points[i-1].y - this.points[i].y;
                    theta_radians = Math.atan2(delta_y, delta_x);
                })
                .on("drag", function(d,i) {
                    g.selectAll(".lineGuide").remove();
                    this.points[i].x = d3.event.x;
                    this.points[i].y = d3.event.y;

                    let j = 0;
                    if(i % 3 === 1){
                        j = i-1;
                        this.points[j-1] = this.pontoOposto(this.points[j].x, this.points[j].y, this.points[i].x, this.points[i].y);
                    }else if(i % 3 === 2){
                        j = i+1;
                        if(j+1 < this.points.length) this.points[j+1] = this.pontoOposto(this.points[j].x, this.points[j].y, this.points[i].x, this.points[i].y);
                    }else{
                        let x3 = this.points[i].x + (distance * Math.cos(theta_radians));
                        let y3 = this.points[i].y + (distance * Math.sin(theta_radians));
                        this.points[i-1] = [x3,y3];

                        if(i+1 < this.points.length) this.points[i+1] = this.pontoOposto(this.points[i].x, this.points[i].y, this.points[i-1].x, this.points[i-1].y);
                    }

                    this.funcao();
                })
                .on("end", function(d,i) {
                    //ipc.send('get-path2', getPath());
                }));

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

        return [x3,y3];
    }
}

class Spiral extends Drawings{

}

if(module){
    module.exports = Bezier;
}