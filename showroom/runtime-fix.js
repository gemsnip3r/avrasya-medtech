(() => {
  if (typeof Component === 'undefined') { console.error('Avrasya patch: Component unavailable'); return; }
  const P = Component.prototype;

  // Real PLY: load the web-LOD models prepared from the original upper/lower scans.
  P.loadRealScans = async function () {
    const S = this._three; if (!S) return; const T = S.T;
    try {
      const mod = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/PLYLoader.js');
      const loader = new mod.PLYLoader();
      const loadPacked = async (name) => {
        const parts = await Promise.all([0,1,2].map(async i => {
          const u = `/assets/ply/${name}-${i}.txt`;
          const r = await fetch(u, { cache: 'force-cache' });
          if (!r.ok) throw new Error(`PLY ${name} chunk ${i}: ${r.status}`);
          return r.text();
        }));
        const b64 = parts.join('').replace(/\s+/g, '');
        const bin = atob(b64), bytes = new Uint8Array(bin.length);
        for (let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
        if (!('DecompressionStream' in window)) throw new Error('gzip unsupported');
        const ab = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
        const geo = loader.parse(ab); geo.computeVertexNormals(); return geo;
      };
      const [gU,gL] = await Promise.all([loadPacked('upper'), loadPacked('lower')]);
      const box = new T.Box3(); [gU,gL].forEach(g => { g.computeBoundingBox(); box.union(g.boundingBox); });
      const center = box.getCenter(new T.Vector3()), size = box.getSize(new T.Vector3());
      const scl = 7.2 / (Math.max(size.x,size.y,size.z)||1);
      const ext=[size.x,size.y,size.z], nAxis=ext.indexOf(Math.min(...ext));
      const holder=new T.Group();
      if(nAxis===2) holder.rotation.x=-Math.PI/2; else if(nAxis===0) holder.rotation.z=Math.PI/2;
      holder.scale.setScalar(scl);
      const matFor=()=>new T.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:0,clippingPlanes:[S.clip],clipShadows:true,side:T.DoubleSide});
      const meshes=[];
      const mk=(g,low)=>{g.translate(-center.x,-center.y,-center.z);const m=new T.Mesh(g,matFor());m.userData.isLower=low;holder.add(m);meshes.push(m);return m};
      S.upperMesh=mk(gU,false); S.lowerMesh=mk(gL,true); S.pivot.add(holder); S.holder=holder; S.real=true; S.realMeshes=meshes;
      const wb=new T.Box3().setFromObject(holder); S.clipMin=wb.min.x-.05;S.clipMax=wb.max.x+.05;S.scanTheta=0;S.scanPhi=.92;S.target.set(0,0,0);S.dist=9.4;S.phi=.92;
      this.updateScan3D(); this.setState({scan3dOk:true});
    } catch(e) { console.error('Real PLY failed',e); this.buildProceduralArches(); }
  };

  P.renderGuidedDesign = function () {
    const img=this.smileImgRef?.current, stage=this.stageRef?.current;
    if(!img||!stage||!img.naturalWidth) return;
    const s=this.state, shade=this.SHADES[s.shade], W=img.naturalWidth,H=img.naturalHeight;
    const cv=this._guidedCv||(this._guidedCv=document.createElement('canvas'));cv.width=W;cv.height=H;
    const c=cv.getContext('2d');c.drawImage(img,0,0,W,H);
    const r=stage.getBoundingClientRect(), ar=W/H, bar=r.width/r.height;let dw,dh,ox,oy;
    if(ar>bar){dw=r.width;dh=r.width/ar;ox=0;oy=(r.height-dh)/2}else{dh=r.height;dw=r.height*ar;oy=0;ox=(r.width-dw)/2}
    const cx=Math.max(0,Math.min(W,(r.width*s.mouthX/100-ox)/dw*W));
    const cy=Math.max(0,Math.min(H,(r.height*s.mouthY/100-oy)/dh*H));
    const zw=Math.max(W*.16,(r.width*(34*s.toothW/100)/100)/dw*W);
    const zh=Math.max(H*.045,(r.height*(20*s.toothH/100)/100)/dh*H);
    const count=10,gap=zw*.008,weights=[.78,.92,1.04,1.12,1.18,1.18,1.12,1.04,.92,.78],sum=weights.reduce((a,b)=>a+b,0),base=(zw-gap*9)/sum;
    const radius={natural:.22,square:.08,oval:.44,hollywood:.15}[s.toothPreset]??.22;
    const tone=s.smileMode==='hollywood'?this.mix(shade.hex,'#ffffff',.34):shade.hex;
    let x=cx-zw/2;c.save();c.globalAlpha=s.smileMode==='hollywood'?.97:.91;c.shadowColor='rgba(45,30,18,.14)';c.shadowBlur=Math.max(1,zh*.03);
    for(let i=0;i<count;i++){
      const tw=base*weights[i], side=Math.abs(i-4.5)/4.5, th=zh*(1-side*.18)*(s.toothPreset==='oval'?.96:1), ty=cy-th*.52+side*zh*.035;
      const g=c.createLinearGradient(0,ty,0,ty+th);g.addColorStop(0,this.mix(tone,'#d8c4a8',s.toothPreset==='natural'?.1:.04));g.addColorStop(.68,tone);g.addColorStop(1,this.mix(tone,'#ffffff',.36));c.fillStyle=g;c.beginPath();
      const rr=Math.max(2,Math.min(tw,th)*radius); if(c.roundRect)c.roundRect(x,ty,tw,th,[rr,rr,Math.min(rr*1.25,th*.35),Math.min(rr*1.25,th*.35)]);else c.rect(x,ty,tw,th);
      c.fill();c.strokeStyle='rgba(105,86,68,.2)';c.lineWidth=Math.max(.6,W/1400);c.stroke();x+=tw+gap;
    }
    c.restore(); this.setState({afterUrl:cv.toDataURL('image/jpeg',.93)});
  };

  P.maybeRenderDesign = function () {
    const s=this.state;
    const key=[s.shade,s.smileMode,s.toothPreset,s.toothW,s.toothH,s.mouthX,s.mouthY,s.whiteIntensity,s.photoMode,s.customUrl||'example',!!this._rawLM].join('|');
    if(key===this._designKey)return;this._designKey=key;clearTimeout(this._designT);
    this._designT=setTimeout(()=>{ if(this._rawLM) this.renderDesign(); else this.renderGuidedDesign(); },45);
  };

  const detect=P.detectFace;
  P.detectFace=async function(...args){try{return await detect.apply(this,args)}finally{setTimeout(()=>this.maybeRenderDesign(),80)}};
  const upload=P.onUpload;
  P.onUpload=function(...args){const x=upload.apply(this,args);setTimeout(()=>{this._designKey=null;this.maybeRenderDesign()},180);return x};
  const scene=P.sceneVals;
  P.sceneVals=function(){
    const out=scene.call(this),s=this.state;
    if(s.room==='smile'){setTimeout(()=>this.maybeRenderDesign(),0);out.afterReady=!!s.afterUrl;out.afterUrl=s.afterUrl;out.boxMode=!s.landmarks;}
    const designed=s.afterUrl||(s.photoMode==='custom'&&s.customUrl?s.customUrl:'assets/teeth-comparison.jpg');
    if(s.room==='whitening'){out.whiteStageImg=designed;}
    if(s.room==='final'){out.photoSrcFinal=designed;}
    return out;
  };

  console.info('Avrasya interactive modules patch active');
})();