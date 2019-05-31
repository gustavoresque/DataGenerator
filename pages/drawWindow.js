class Point{
    constructor(){
        this.x = 0;
        this.y = 0;
    }
}
class Drawings{
    constructor(_points){
        this.points = _points;
    }

    get points(){
        return this.points;
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
    getPath(){
        let str = '';
        if (this.points.length > 0){//Primeiro ponto
            str = "M "+this.points[0].x+","+this.points[0].y+" C";
        }
        for(let i=1; i<this.points.length; i++){//Pontos do meio
            str += " "+this.points[i].x+","+this.points[i].y;
        }

        let path = d3.select('path').attr("class", "definitive").attr("id", 0).attr("d",str)
            .style("fill","none").style("stroke","black").style("stroke-width","3px");

        return path;
    }
}

class Spiral extends Drawings{

}

let Drawing.

if(module){
    module.exports = DataGen;
}