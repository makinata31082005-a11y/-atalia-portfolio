// Light strands behind the longread, after Natali's reference video, in pink.
// A bundle of thin glowing fibres that comes out of the hero figure and runs down the whole page;
// the fibres roll over each other, carry sparkles and glow (bloom), and go soft in places.
(function(){
  var c=document.createElement('canvas');c.className='wave';c.setAttribute('aria-hidden','true');
  document.body.insertBefore(c,document.body.firstChild);
  var gl=c.getContext('webgl',{alpha:false,antialias:true,premultipliedAlpha:false});
  if(!gl){c.remove();return}
  var still=matchMedia('(prefers-reduced-motion: reduce)');

  function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(x);return x}
  function prog(v,f){var p=gl.createProgram();gl.attachShader(p,sh(gl.VERTEX_SHADER,v));gl.attachShader(p,sh(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw gl.getProgramInfoLog(p);return p}

  // the bundle is laid along the page: it comes out of the hero figure and runs down to the bottom,
  // swinging right, left, right, so scrolling travels along it. Page px, y measured down the document.
  var CURVE=[
  'uniform float T,VW,VH,SY,Y0,Y1,YS,XS,HD;',
  // HD: how far down the page the fibres have flowed out of the figure so far
  'float out_(float y){return smoothstep(HD,HD-VH*.3,y);}',
  'float ramp(float y){return smoothstep(YS,YS+VH*1.2,y);}',
  'float px(float y){float q=(y-YS)/VH,r=ramp(y);return mix(XS,VW*.5,r)+r*VW*(.25*sin(q*1.2)+.07*sin(q*.5+1.3));}',
  'float wd(float y){float q=(y-YS)/VH;return min(VW,VH)*(.012+ramp(y)*(.24+.07*sin(q*.9+1.)));}',  // thin at the figure, fans out below
  'vec2 fibre(float y,vec4 a){float q=(y-YS)/VH;vec2 d=normalize(vec2(px(y+2.)-px(y-2.),4.));vec2 n=vec2(d.y,-d.x);',
  // every fibre keeps its own lane (no twisting round an axis); slow waves run down it, so the strands flow
  ' float lane=a.y*cos(a.z)+.22*sin(q*1.3+a.w*6.-T*.35),w=wd(y);',
  ' return vec2(px(y),y)+n*w*(lane+.1*sin(q*3.5-T*.9+a.w*4.)*ramp(y)+.03*sin(q*7.-T*1.2+a.w*20.));}',
  'vec4 clip(vec2 p){return vec4(p.x/VW*2.-1.,1.-(p.y-SY)/VH*2.,0.,1.);}'].join('\n');

  var pLine=prog(['attribute vec4 a;attribute float u;',CURVE,'varying float vI;varying float vC;',
  'void main(){float y=mix(Y0,Y1,u);gl_Position=clip(fibre(y,a));float q=(y-YS)/VH;',
  ' float run=.3+.7*pow(.5+.5*sin(q*5.-T*2.4+a.w*30.),3.);',            // light running down the fibre
  ' vC=fract(a.w*7.31);',
  // about one fibre in seven is a pale glowing one with bright streaks racing down it
  ' if(vC>.86)run=.35+3.*pow(.5+.5*sin(q*3.-T*3.2+a.w*50.),10.);',
  ' vI=run*out_(y)*smoothstep(YS,YS+40.,y)*(.55+.45*fract(a.w*13.7));}'].join('\n'),
  ['precision mediump float;varying float vI;varying float vC;uniform float K;',
  'void main(){vec3 pink=vec3(1.,.3,.62),hot=vec3(1.,.62,.84),lil=vec3(.55,.35,1.);',
  ' vec3 col=vC>.86?vec3(1.,.9,.97):(vC<.18?lil:(vC<.42?hot:pink));gl_FragColor=vec4(col*vI*K,1.);}'].join('\n'));

  var pDot=prog(['attribute vec4 a;attribute float u;',CURVE,'varying float vI;uniform float DPR;',
  'void main(){float L=Y1-Y0,y=Y0+mod(u*L+T*VH*.06*(.4+fract(a.w*5.3))-Y0,L);gl_Position=clip(fibre(y,a));',   // sparkles drift down the page
  ' vI=pow(.5+.5*sin(T*2.3+a.w*60.),6.)*smoothstep(YS,YS+VH*.5,y)*out_(y);gl_PointSize=DPR*(1.+2.*fract(a.w*9.1));}'].join('\n'),
  ['precision mediump float;varying float vI;',
  'void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(vec3(1.,.75,.9)*vI*smoothstep(.5,.1,r),1.);}'].join('\n'));

  var QV='attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
  var pBlur=prog(QV,['precision mediump float;varying vec2 v;uniform sampler2D S;uniform vec2 D;',
  'void main(){vec4 c=texture2D(S,v)*.227;',
  ' c+=(texture2D(S,v+D*1.385)+texture2D(S,v-D*1.385))*.316;',
  ' c+=(texture2D(S,v+D*3.231)+texture2D(S,v-D*3.231))*.070;gl_FragColor=c;}'].join('\n'));
  var pOut=prog(QV,['precision mediump float;varying vec2 v;uniform sampler2D S,B,W;uniform float F,G;',
  'void main(){vec3 s=texture2D(S,v).rgb,b=texture2D(B,v).rgb,w=texture2D(W,v).rgb;',
  ' vec3 col=mix(s,w*2.4,F)+b*.8+w*(1.6+2.4*G);col=1.-exp(-col*2.2);',                               // sharp fibres, or soft when close + glow
  ' gl_FragColor=vec4(vec3(.11)+col,1.);}'].join('\n'));

  // geometry: fibres as line pairs along u, sparkles as points
  function rnd(s){return function(){s|=0;s=s+0x6D2B79F5|0;var t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  var R=rnd(7),NF=170,NS=230,la=[],lu=[];
  for(var i=0;i<NF;i++){var A=[Math.sqrt(R())*(R()<.15?1.35:1),R()*6.283,R()*6.283,R()];
    for(var k=0;k<NS-1;k++){[k,k+1].forEach(function(j){la.push(0,A[0],A[1],A[3]);lu.push(j/(NS-1))})}}
  var da=[],du=[];for(var m=0;m<1400;m++){da.push(0,Math.sqrt(R()),R()*6.283,R());du.push(R())}
  function buf(d){var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(d),gl.STATIC_DRAW);return b}
  var LA=buf(la),LU=buf(lu),DA=buf(da),DU=buf(du),QB=buf([-1,-1,3,-1,-1,3]),NL=lu.length,ND=du.length;

  function target(w,h){var t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR)});
    [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE)});
    var f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);
    return {t:t,f:f,w:w,h:h}}
  var T={},W=0,H=0;
  function size(w,h){W=w;H=h;['s','a','b','c','d','e','g'].forEach(function(k){var o=T[k];if(o){gl.deleteTexture(o.t);gl.deleteFramebuffer(o.f)}});
    T.s=target(w,h);T.a=target(w>>1,h>>1);T.b=target(w>>1,h>>1);T.c=target(w>>2,h>>2);T.d=target(w>>2,h>>2);T.e=target(w>>3,h>>3);T.g=target(w>>3,h>>3)}

  function attr(p,name,b,n){var l=gl.getAttribLocation(p,name);if(l<0)return;gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,0,0)}
  function uni(p,n){return gl.getUniformLocation(p,n)}
  function quad(p){gl.useProgram(p);attr(p,'p',QB,2)}
  function blur(src,dst,dx,dy){gl.bindFramebuffer(gl.FRAMEBUFFER,dst.f);gl.viewport(0,0,dst.w,dst.h);quad(pBlur);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,src.t);gl.uniform1i(uni(pBlur,'S'),0);gl.uniform2f(uni(pBlur,'D'),dx/src.w,dy/src.h);gl.drawArrays(gl.TRIANGLES,0,3)}

  // soft focus and flare along the way: [scroll, soft, flare]
  var KEYS=[[0,.1,.35],[.15,.3,.5],[.32,.6,.8],[.5,.35,.55],[.68,.6,.8],[.85,.3,.5],[1,.1,.35]];
  function key(s){var i=0;while(i<KEYS.length-2&&s>KEYS[i+1][0])i++;var a=KEYS[i],b=KEYS[i+1],t=Math.min(1,Math.max(0,(s-a[0])/(b[0]-a[0])));
    t=t*t*(3-2*t);return a.map(function(x,j){return x+(b[j]-x)*t})}
  // where the bundle starts: the middle of the hero figure, in page px
  function start(){var f=document.querySelector('.hero3d');if(!f)return[innerWidth/2,innerHeight/2];
    var r=f.getBoundingClientRect();return[r.left+r.width/2,r.top+scrollY+r.height/2]}

  var last=performance.now(),s=0,time=0,head=-1;
  (function frame(){
    // shortcut: draws at most 1 px per CSS px; the glow hides the rest
    var k=Math.min(devicePixelRatio||1,1),w=Math.max(8,Math.round(innerWidth*k)),h=Math.max(8,Math.round(innerHeight*k));
    if(c.width!==w||c.height!==h){c.width=w;c.height=h}
    if(W!==w||H!==h)size(w,h);
    // the first screen belongs to the cross, so the flight starts as it scrolls away
    var h0=innerHeight*.6,max=Math.max(1,document.documentElement.scrollHeight-innerHeight-h0),want=Math.min(1,Math.max(0,(scrollY-h0)/max));var gap=want-s;s+=gap*(still.matches?1:.045);
    // fibres crawl slowly when the page rests and pick up while it scrolls
    var now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;
    if(!still.matches)time+=dt*(.3+1.5*Math.min(1,Math.abs(gap)*40));var C=key(s);
    var o=start();
    // nothing on the first screen; scrolling lets the fibres pour out of the figure and run ahead down the page
    var goal=o[1]+(scrollY>2?scrollY*2.5+innerHeight*.1:0);if(head<0||still.matches)head=goal;head+=(goal-head)*.05;
    var vh=innerHeight,y0=Math.max(o[1],scrollY-vh*.25),y1=Math.max(y0+1,scrollY+vh*1.25);
    function set(p){[['T',time],['VW',innerWidth],['VH',vh],['SY',scrollY],['Y0',y0],['Y1',y1],['YS',o[1]],['XS',o[0]],['HD',head]].forEach(function(x){gl.uniform1f(uni(p,x[0]),x[1])})}
    // 1) fibres and sparkles, added on top of each other so dense places burn bright
    gl.bindFramebuffer(gl.FRAMEBUFFER,T.s.f);gl.viewport(0,0,w,h);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
    gl.useProgram(pLine);attr(pLine,'a',LA,4);attr(pLine,'u',LU,1);
    set(pLine);gl.uniform1f(uni(pLine,'K'),.5);
    gl.drawArrays(gl.LINES,0,NL);
    gl.useProgram(pDot);attr(pDot,'a',DA,4);attr(pDot,'u',DU,1);
    set(pDot);gl.uniform1f(uni(pDot,'DPR'),k);
    gl.drawArrays(gl.POINTS,0,ND);
    gl.disable(gl.BLEND);
    // 2) glow and soft-focus copies
    blur(T.s,T.a,1,0);blur(T.a,T.b,0,1);blur(T.b,T.c,1,0);blur(T.c,T.d,0,1);
    blur(T.d,T.e,1.5,0);blur(T.e,T.g,0,1.5);blur(T.g,T.e,1.5,0);blur(T.e,T.g,0,1.5);
    // 3) onto the page colour
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,w,h);quad(pOut);
    [[T.s,'S'],[T.d,'B'],[T.g,'W']].forEach(function(x,i){gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,x[0].t);gl.uniform1i(uni(pOut,x[1]),i)});
    gl.uniform1f(uni(pOut,'F'),C[1]);gl.uniform1f(uni(pOut,'G'),C[2]*(.85+.15*Math.sin(time*.7)));gl.drawArrays(gl.TRIANGLES,0,3);
    requestAnimationFrame(frame);
  })();
})();
