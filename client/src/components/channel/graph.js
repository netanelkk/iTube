export function graph(c, data, full = true) {
    const xoffset = 100;
    var max = Math.ceil(Math.max(...data)/50)*50;
    max = (max === 0) ? 50 : max;
    var ctx = c.getContext("2d");
    const zeroPad = (num) => String(num).padStart(2, '0');
    
    ctx.beginPath();
    ctx.strokeStyle = "#d3d3d3";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(xoffset/2, 1, 570, 200);
    
    ctx.moveTo(xoffset/2,40);
    for(let i = 1; i < 5; i++) {
        ctx.lineTo(620,i*40);
        ctx.moveTo(xoffset/2,(i+1)*40);
    }
    ctx.stroke();
    
    
    ctx.beginPath();
    ctx.font = "11px Calibri";
    ctx.fillStyle = "#8a8a8a";
    for(let i = 0; i < 5; i++) {
        let off = (i==0) ? 0 : 5;
        let yval = max/5*(5-i);
        ctx.fillText(yval, xoffset/2 - ctx.measureText(yval).width - 5,10 + 40*i - off);
    }
    ctx.fillText("0",xoffset/2 - 10,200);
    
    let date = new Date();
    date.setMonth(date.getMonth() - 5);
    for(let i = 0; i < 6; i++) {
        const xval = zeroPad(date.getMonth()+1)+"/"+date.getFullYear();
        ctx.fillText(xval,xoffset*(i+1)-ctx.measureText(xval).width/2,215);
        date.setMonth(date.getMonth() + 1);
    }
    ctx.stroke();
    
    if(full) {
    var linegrad = ctx.createLinearGradient(xoffset, Y(data[0], max), 500+xoffset,200);
    linegrad.addColorStop(0, "#b2d143");
    linegrad.addColorStop(0.5, "#80bd7e");
    linegrad.addColorStop(1, "#53baaf");
    
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2;
    ctx.strokeStyle = linegrad;
    let dots = [{x: xoffset, y: Y(data[0], max)}];
    ctx.moveTo(dots[0].x, dots[0].y);
    for(let i = 1; i < data.length; i++) {
        dots[i] = {x: i*100+xoffset, y: Y(data[i], max)}
        ctx.lineTo(dots[i].x, dots[i].y);
    }
    ctx.stroke();
    ctx.lineTo(500+xoffset,200);
    ctx.lineTo(xoffset,200);
    ctx.closePath();
    
    var x = xoffset, y = Y(Math.max(...data), max);
    var angle = 79 * Math.PI / 180,
        x2 = 500 * Math.cos(angle),
        y2 = 200 * Math.sin(angle);
    var fillgrad = ctx.createLinearGradient(x, y, x2, y2);
    
    fillgrad.addColorStop(0, "#c9f1e991");
    fillgrad.addColorStop(1, "#ffffff52");
    ctx.fillStyle = fillgrad;
    ctx.fill();

    return dots;
    }

}
    
function Y(val, max) {
    return 200-(val/max)*200;
}
    
    