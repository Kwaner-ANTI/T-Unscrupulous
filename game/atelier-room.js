import * as THREE from './vendor/three.module.js';
import { canvasTexture, panel, mesh, box, instances, inlay, fanPaths } from './art-geometry.js';

function stoneMap() {
  return canvasTexture((c,w,h)=>{
    c.fillStyle='#1d2931';c.fillRect(0,0,w,h);
    for(let j=0;j<29;j++) {
      c.strokeStyle=j%5===0?'#5f6a69':'#35444b';c.lineWidth=j%5===0?1.5:.65;
      c.beginPath();for(let x=0;x<=w;x+=5){const y=j*32+Math.sin(x*.013+j)*15+Math.sin(x*.041+j*7)*3;x?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
    }
  },1024,1024);
}

function cityWindowMap() {
  // One continuous panorama, sampled by each window at its actual wall position.
  return canvasTexture((c,w,h)=>{
    const sky=c.createLinearGradient(0,0,0,h);
    sky.addColorStop(0,'#59778b');sky.addColorStop(.58,'#9ba9ac');sky.addColorStop(1,'#c1b9a5');
    c.fillStyle=sky;c.fillRect(0,0,w,h);
    const cloud=c.createLinearGradient(0,100,0,460);
    cloud.addColorStop(0,'#d4d9d518');cloud.addColorStop(.5,'#cbd3d437');cloud.addColorStop(1,'#bdc8c600');
    c.fillStyle=cloud;c.fillRect(0,100,w,400);
    function building(x,top,bw,bottom,layer,index) {
      const side=bw*.16, front=bw-side;
      c.fillStyle=['#81939e','#5a7281','#3b5365'][layer];c.fillRect(x,top,front,bottom-top);
      c.fillStyle=['#6f8593','#456071','#2d4355'][layer];
      c.beginPath();c.moveTo(x+front,top);c.lineTo(x+bw,top+9);c.lineTo(x+bw,bottom);c.lineTo(x+front,bottom);c.fill();
      // Roof coping, recessed top storey and small rooftop service rooms.
      c.fillStyle=['#a1afb4','#83939b','#6b7d88'][layer];c.fillRect(x-3,top,front+6,5);
      c.fillStyle=['#788f9d','#526b7b','#344c5d'][layer];c.fillRect(x+front*.22,top-18,front*.52,18);
      if(index%4===0){c.fillRect(x+front*.45,top-42,3,24);}
      const floor=layer===0?19:27, bay=layer===0?13:21;
      for(let y=top+17,row=0;y<bottom-8;y+=floor,row++) {
        if(layer>0){c.fillStyle=layer===1?'#b3bbba26':'#afbdc32b';c.fillRect(x+2,y+floor-6,front-4,2);}
        for(let xx=x+8,col=0;xx<x+front-7;xx+=bay,col++) {
          const lit=(row*13+col*7+index*11)%19<3;
          c.fillStyle=lit?['#cfccaf','#d4c49d','#e7c58b'][layer]:['#607c8e','#344f63','#1b3349'][layer];
          c.fillRect(xx,y,layer===0?5:9,layer===0?9:14);
          if(layer===2){c.fillStyle='#9ca9ab66';c.fillRect(xx-1,y+14,11,2);}
        }
      }
      if(layer===2){
        c.fillStyle='#8799a16b';
        for(let xx=x+3;xx< x+front;xx+=42)c.fillRect(xx,top+6,2,bottom-top-6);
        c.fillStyle='#233b4f';c.fillRect(x-4,top+62,front+8,5);
      }
    }
    // Distant skyline is lower contrast and finer grained than the nearer blocks.
    for(let i=0,x=-20;x<w;i++){
      const bw=44+(i*31%47);building(x,320+(i*67%150),bw,h,0,i);x+=bw+8;
    }
    const haze=c.createLinearGradient(0,280,0,h);haze.addColorStop(0,'#bac7cc00');haze.addColorStop(1,'#bac7cc78');
    c.fillStyle=haze;c.fillRect(0,280,w,h-280);
    for(let i=0,x=-60;x<w;i++){
      const bw=100+(i*37%70);building(x,260+(i*103%220),bw,h,1,i);x+=bw+34;
    }
    // Uneven heights, flat roofs and a few stepped towers give the street a readable scale.
    [[90,445,190],[390,365,155],[710,490,220],[1110,330,168],[1460,450,200],[1810,390,176],[2130,500,210]].forEach(([x,y,bw],i)=>building(x,y,bw,h,2,i));
    const mist=c.createLinearGradient(0,450,0,h);mist.addColorStop(0,'#b3c4cb00');mist.addColorStop(1,'#9aafb936');
    c.fillStyle=mist;c.fillRect(0,450,w,h-450);
    // Sparse fine rain stays on the glazing instead of obscuring the architecture.
    c.strokeStyle='#e2edf023';c.lineWidth=1;
    for(let i=0;i<95;i++){const x=i*173%w,y=i*97%h;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+15+i%18);c.stroke();}
  },2400,840);
}

function speaker(parent,x,y,z,black,brass) {
  panel(parent,[.58,.86,.42],[x,y,z],black,undefined,{radius:.035,bevel:.012});
  box(parent,[.51,.78,.018],[x,y,z+.224],new THREE.MeshStandardMaterial({color:0x293640,roughness:.9}));
  for(const [offset,radius] of [[-.17,.165],[.22,.075]]) {
    const rim=mesh(parent,new THREE.TorusGeometry(radius,.014,8,48),brass,[x,y+offset,z+.24]);
    const cone=mesh(parent,new THREE.ConeGeometry(radius*.88,.065,48,1,true),black,[x,y+offset,z+.218]);cone.rotation.x=Math.PI/2;
    const cap=mesh(parent,new THREE.SphereGeometry(radius*.3,20,10),brass,[x,y+offset,z+.25]);cap.scale.z=.35;
  }
}

function lantern(parent,x,black,brass,glass) {
  const z=-.35;
  const base=mesh(parent,new THREE.CylinderGeometry(.18,.23,.065,8),black,[x,.64,z]);base.rotation.y=Math.PI/8;
  mesh(parent,new THREE.CylinderGeometry(.025,.035,.63,24),brass,[x,.96,z]);
  panel(parent,[.28,.59,.24],[x,1.54,z],black,undefined,{radius:.025});
  box(parent,[.24,.5,.012],[x,1.54,z+.128],glass);
  instances(parent,new THREE.BoxGeometry(.012,.5,.018),brass,[-.095,-.047,0,.047,.095].map(dx=>({position:[x+dx,1.54,z+.139]})));
  for(const y of [1.25,1.82])box(parent,[.3,.035,.27],[x,y,z],brass);
  box(parent,[.23,.05,.21],[x,1.866,z],black);
}

export function buildRoom(scene) {
  const room=new THREE.Group();room.name='ATELIER / NOCTURNE';scene.add(room);
  const onyx=new THREE.MeshStandardMaterial({map:stoneMap(),color:0xb1bcc3,roughness:.36,metalness:.18});
  const black=new THREE.MeshStandardMaterial({color:0x101b25,roughness:.52,metalness:.3});
  const wallMaterial=new THREE.MeshStandardMaterial({color:0x253744,roughness:.94});
  const brass=new THREE.MeshStandardMaterial({color:0xb19c71,metalness:.72,roughness:.4});
  const ivory=new THREE.MeshStandardMaterial({color:0xd5c8a4,roughness:.54});
  const amber=new THREE.MeshStandardMaterial({color:0xd6b979,emissive:0xb68b47,emissiveIntensity:1.3,roughness:.45});
  // Layered onyx counter with a bronze edge and leather work mat.
  panel(room,[7.8,3.7,.18],[0,.47,.3],onyx,undefined,{radius:.1,bevel:.022,segments:5}).rotation.x=-Math.PI/2;
  box(room,[7.6,.85,3.3],[0,-.07,.3],black);
  box(room,[7.75,.025,3.58],[0,.42,.3],brass);
  instances(room,new THREE.BoxGeometry(.033,.7,.045),brass,Array.from({length:35},(_,i)=>({position:[-3.4+i*.2,-.05,1.971]})));
  const leatherMap=canvasTexture((c,w,h)=>{c.fillStyle='#26313a';c.fillRect(0,0,w,h);for(let i=0;i<16000;i++){c.fillStyle=i%2?'#b6b3a007':'#020a1012';c.fillRect((i*127)%w,(i*73)%h,1,2);}c.strokeStyle='#b7a67c';c.lineWidth=2;c.strokeRect(16,16,w-32,h-32);c.strokeRect(23,23,w-46,h-46);},512,512);
  const mat=panel(room,[1.8,1.3,.025],[0,.582,.17],new THREE.MeshStandardMaterial({map:leatherMap,roughness:.98}),undefined,{radius:.045,bevel:.004});mat.rotation.x=-Math.PI/2;
  // Monumental stepped pilasters and cold, rain-muted city windows.
  const wall=mesh(room,new THREE.PlaneGeometry(16,9),wallMaterial,[0,3,-3.25]);
  const windowMap=cityWindowMap();
  for(const side of [-1,1]) {
    const x=side*2.03;
    panel(room,[1.43,2.52,.09],[x,2.16,-3.08],brass,undefined,{radius:.015});
    const view=windowMap.clone();view.repeat.set(1.3/6.8,1);view.offset.set((x-.65+3.4)/6.8,0);
    mesh(room,new THREE.PlaneGeometry(1.3,2.37),new THREE.MeshBasicMaterial({map:view,color:0xe1e7eb,toneMapped:false}),[x,2.16,-3.022]);
    instances(room,new THREE.BoxGeometry(.032,2.37,.065),black,[-.35,0,.35].map(dx=>({position:[x+dx,2.16,-2.98]})));
    for(const y of [1.27,2.16,3.05])box(room,[1.31,.037,.065],[x,y,-2.98],black);
    const columnX=side*1.19;
    box(room,[.4,3.15,.35],[columnX,1.85,-2.81],black);
    instances(room,new THREE.BoxGeometry(.027,2.72,.05),brass,Array.from({length:7},(_,i)=>({position:[columnX-.14+i*.046,1.8,-2.61]})));
    for(let step=0;step<3;step++)box(room,[.46+step*.1,.09,.41+step*.06],[columnX,3.26+step*.085,-2.79],step===1?brass:black);
  }
  // Central fan-shaped transom: the Deco language is present in the scene geometry.
  panel(room,[1.97,1.2,.1],[0,2.88,-2.97],black,undefined,{radius:.025});
  inlay(room,fanPaths(0,2.64,-2.9,.89,17),0xb9a477);
  for(let i=0;i<3;i++)box(room,[1.85-i*.19,.023,.025],[0,2.58-i*.045,-2.89],brass);
  const signage=canvasTexture((c,w,h)=>{
    c.fillStyle='#101b25';c.fillRect(0,0,w,h);c.strokeStyle='#ad996a';c.lineWidth=2;c.strokeRect(10,10,w-20,h-20);
    c.textAlign='center';c.fillStyle='#ddceaa';c.font='32px Georgia';c.fillText('A T E L I E R',w/2,62);c.font='11px sans-serif';c.fillStyle='#8d9ca5';c.fillText('SECOND SOUND  /  NOCTURNE',w/2,93);
  },768,128);
  mesh(room,new THREE.PlaneGeometry(1.88,.32),new THREE.MeshStandardMaterial({map:signage,emissive:0x685c43,emissiveIntensity:.25,roughness:.7}),[0,2.44,-2.56]);
  // Display cases: recessed, stepped shelves, original fictional equipment.
  for(const row of [0,1]) {
    const y=.89+row*.92;
    panel(room,[1.72,.67,.25],[0,y+.32,-2.82],black,undefined,{radius:.018});
    box(room,[1.84,.055,.55],[0,y,-2.63],onyx);
    box(room,[1.84,.014,.02],[0,y+.039,-2.34],brass);
    panel(room,[1.32,.28,.38],[0,y+.21,-2.56],black,undefined,{radius:.018});
    const gaugeMap=canvasTexture((c,w,h)=>{c.fillStyle='#192630';c.fillRect(0,0,w,h);c.strokeStyle='#ceb980';c.lineWidth=2;for(let i=0;i<2;i++){c.beginPath();c.arc(65+i*120,82,47,Math.PI,Math.PI*2);c.stroke();c.beginPath();c.moveTo(65+i*120,82);c.lineTo(48+i*120,45);c.stroke();}},256,128);
    mesh(room,new THREE.PlaneGeometry(.42,.19),new THREE.MeshStandardMaterial({map:gaugeMap,emissive:0x8a6a32,emissiveIntensity:.2}),[-.22,y+.21,-2.36]);
    const dial=mesh(room,new THREE.CylinderGeometry(.06,.065,.033,48),brass,[.42,y+.21,-2.35]);dial.rotation.x=Math.PI/2;
  }
  for(const side of [-1,1])speaker(room,side*.76,1.36,-2.05,black,brass);
  lantern(room,-1.86,black,brass,amber);lantern(room,1.86,black,brass,amber);
  const stand=panel(room,[.35,.3,.13],[0,.66,.12],black,undefined,{radius:.025});stand.rotation.x=-Math.PI/2;
  box(room,[.29,.012,.012],[0,.715,.25],brass);
  windowMap.dispose();
  return {group:room};
}
