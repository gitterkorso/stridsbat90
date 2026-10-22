// Report the number of distinct colours and a few sample pixels of a PNG (no deps: uses zlib + manual PNG decode).
const fs=require('fs'), zlib=require('zlib');
const f=process.argv[2];
const buf=fs.readFileSync(f);
let p=8, w,h,bitDepth,colorType, idat=[];
while(p<buf.length){ const len=buf.readUInt32BE(p); const type=buf.toString('ascii',p+4,p+8);
  if(type==='IHDR'){ w=buf.readUInt32BE(p+8); h=buf.readUInt32BE(p+12); bitDepth=buf[p+16]; colorType=buf[p+17]; }
  else if(type==='IDAT'){ idat.push(buf.slice(p+8,p+8+len)); }
  else if(type==='IEND') break;
  p+=12+len; }
const raw=zlib.inflateSync(Buffer.concat(idat));
const ch = colorType===6?4:colorType===2?3:1;
const stride=w*ch;
const out=Buffer.alloc(h*stride);
let pos=0;
for(let y=0;y<h;y++){ const filter=raw[pos++]; const line=raw.slice(pos,pos+stride); pos+=stride;
  for(let x=0;x<stride;x++){ const a=x>=ch?out[y*stride+x-ch]:0, b=y>0?out[(y-1)*stride+x]:0, c=(x>=ch&&y>0)?out[(y-1)*stride+x-ch]:0; let v=line[x];
    if(filter===1)v+=a; else if(filter===2)v+=b; else if(filter===3)v+=(a+b)>>1; else if(filter===4){const pa=Math.abs(b-c),pb=Math.abs(a-c),pc=Math.abs(a+b-2*c); v+= (pa<=pb&&pa<=pc)?a:(pb<=pc?b:c);}
    out[y*stride+x]=v&255; } }
const set=new Set();
for(let y=0;y<h;y+=2) for(let x=0;x<w;x+=2){ const i=y*stride+x*ch; set.add((out[i]<<16)|(out[i+1]<<8)|out[i+2]); }
const px=(x,y)=>{const i=y*stride+x*ch; return '#'+[out[i],out[i+1],out[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');};
console.log(`${f}: ${w}x${h} distinct=${set.size} center=${px(w>>1,h>>1)} tl=${px(20,20)} tr=${px(w-20,20)} bl=${px(20,h-20)}`);
