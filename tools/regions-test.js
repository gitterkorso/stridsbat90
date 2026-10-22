const assert=require('assert'),A=require('../src/archipelago.js');
for(const seed of [90848,42,123456]){
 const w=A.create(seed),stats=[];
 for(const x0 of [-4000,0,3500,9500]){let land=0,n=0,peak=0,forest=0;for(let x=x0-700;x<=x0+700;x+=70)for(let z=-3000;z<=3000;z+=70){const h=w.height(x,z);n++;if(h>0){land++;peak=Math.max(peak,h);forest+=w.habitat(x,z).forest;}}stats.push({land:land/n,peak,forest:forest/(land||1)});}
 assert(stats[0].land>stats[2].land*2);assert(stats[0].forest>.9&&stats[2].forest<.12);assert(stats[0].peak>stats[2].peak);assert.equal(stats[3].land,0);
 let fjord=0,deep=0;for(let x=-4500;x<4500;x+=150)for(let z=-1200;z<=1200;z+=80){if(w.biome(x,z).fjord>.9){fjord++;if(w.depth(x,z)>3)deep++;}}
 assert(deep/fjord>.85,'Fjards should predominantly provide deep open water');
 console.log('PASS regional land cover, forest exposure, low skerries, open sea and fjards',seed,stats.map(s=>Math.round(s.land*100)+'% land').join(' / '));
}
