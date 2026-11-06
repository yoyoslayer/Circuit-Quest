import type {Page} from '@playwright/test';

// Observe the text actually drawn into monitor textures, rather than requiring duplicate HTML.
// Full-canvas clears start a new reading; historical text cannot satisfy a later assertion.
export async function watchMonitorText(page:Page){
 await page.addInitScript(()=>{
  const readings=new Map<HTMLCanvasElement,string[]>();(window as any).__monitorReadings=readings;
  const proto=CanvasRenderingContext2D.prototype,fill=proto.fillRect,text=proto.fillText;
  proto.fillRect=function(x,y,w,h){if(x===0&&y===0&&w>=this.canvas.width&&h>=this.canvas.height)readings.set(this.canvas,[]);return fill.call(this,x,y,w,h);};
  proto.fillText=function(value,x,y,maxWidth){const lines=readings.get(this.canvas)??[];lines.push(String(value));readings.set(this.canvas,lines);if(maxWidth===undefined)return text.call(this,value,x,y);return text.call(this,value,x,y,maxWidth);};
 });
}
export const monitorText=(page:Page,heading:string)=>page.evaluate(heading=>{
 const readings=(window as any).__monitorReadings as Map<HTMLCanvasElement,string[]>;
 return [...readings.values()].find(lines=>lines.includes(heading))?.join(' ')??'';
},heading);
