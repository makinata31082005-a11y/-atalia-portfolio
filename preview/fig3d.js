// One material for every 3D figure: dark glossy glass that bends whatever is drawn behind it
// (the hero title), turns toward the cursor and can be recoloured pink.
var FIG_SHAPES={
  // her Spline figure: three rounded cylinders melted into a cross, seen at an angle
  cross:'mat3 QB(float th,float ya){return rz(.785)*rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float k=.36;return smin(smin(cyl(p,.40,1.45,.15),cyl(p.yxz,.40,1.45,.15),k),cyl(p.xzy,.5,1.5,.5),k);}',
  // Block signs. Each one is built from the same pieces as the hero cross: rounded bars of
  // radius ~.4 melted together with smin, seen at the same tilt, in the same glass.
  // statistics: a percent sign
  percent:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float d=bar(p,vec3(-.85,-1.25,0.),vec3(.85,1.25,0.),.3);'+
    'd=smin(d,tor((p-vec3(-.78,.8,0.)).xzy,vec2(.42,.2)),.22);d=smin(d,tor((p-vec3(.78,-.8,0.)).xzy,vec2(.42,.2)),.22);return d;}',
  // students' stories: Russian quotation mark «
  quote:'mat3 QB(float th,float ya){return rx(th)*ry(ya+.25);}'+
    'float chev(vec3 p){return smin(bar(p,vec3(.55,.55,0.),vec3(-.4,0.,0.),.26),bar(p,vec3(-.4,0.,0.),vec3(.55,-.55,0.),.26),.14);}'+
    'float map(vec3 p){p=Q*p;return min(chev(p-vec3(-.6,0.,0.)),chev(p-vec3(.6,0.,0.)));}',
  // teachers: "almost equal" sign, from "practice and study matter almost equally"
  approx:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float wave(vec3 p,float o){float x=clamp(p.x,-1.25,1.25);float f=.24*sin(2.3*x+T*.6),df=.552*cos(2.3*x+T*.6);'+
    'return length(vec3(p.x-x,(p.y-o-f)/sqrt(1.+df*df),p.z))-.28;}'+
    'float map(vec3 p){p=Q*p;return min(wave(p,.45),wave(p,-.45));}',
  // time management: a clock, its hands are a small cross
  clock:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float d=tor(p.xzy,vec2(1.15,.26));float a=T*.15;'+
    'float h=smin(bar(p,vec3(0.),vec3(.8*sin(a),.8*cos(a),0.),.17),bar(p,vec3(0.),vec3(.55*cos(a*.3+.6),-.55*sin(a*.3+.6),0.),.17),.1);'+
    'return min(d,smin(h,length(p)-.24,.1));}',
  // calm: pause, the two bars breathe slowly
  pause:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float l=1.2+.08*sin(T*.8);'+
    'return min(bar(p,vec3(-.45,-l,0.),vec3(-.45,l,0.),.36),bar(p,vec3(.45,-l,0.),vec3(.45,l,0.),.36));}',
  // rights ("Качай права" = pump your rights): a dumbbell
  dumbbell:'mat3 QB(float th,float ya){return rz(.35)*rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float d=bar(p,vec3(-1.35,0.,0.),vec3(1.35,0.,0.),.17);vec3 q=vec3(abs(p.x),p.y,p.z);'+
    'd=smin(d,cyl((q-vec3(.82,0.,0.)).yxz,.66,.16,.1),.08);d=smin(d,cyl((q-vec3(1.12,0.,0.)).yxz,.5,.12,.08),.08);return d;}',
  // job search ("кто ищет, тот всегда найдёт"): a check mark
  check:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;return smin(bar(p,vec3(-1.,.15,0.),vec3(-.3,-.62,0.),.32),bar(p,vec3(-.3,-.62,0.),vec3(1.05,1.,0.),.32),.3);}'
};
function fig3d(c,o){
  var gl=c.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false});
  if(!gl)return false;
  var vs='attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';
  var fs=[
  'precision highp float;uniform vec2 R;uniform float T,P;uniform vec2 M;uniform vec3 TC,BG;uniform sampler2D TX;uniform vec4 G;',
  'mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}',
  'mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}',
  'mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}',
  'mat3 Q;',
  'float cyl(vec3 p,float r,float h,float e){vec2 d=vec2(length(p.xz)-r+e,abs(p.y)-h+e);return min(max(d.x,d.y),0.)+length(max(d,0.))-e;}',
  'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
  'float smax(float a,float b,float k){return -smin(-a,-b,k);}',
  'float cap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}',
  'float tor(vec3 p,vec2 t){return length(vec2(length(p.xz)-t.x,p.y))-t.y;}',
  'float rbox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}',
  'float ell(vec3 p,vec3 r){float k0=length(p/r),k1=length(p/(r*r));return k0*(k0-1.)/k1;}',
  // rounded bar between two points, same profile as the cross arms
  'float bar(vec3 p,vec3 a,vec3 b,float r){vec3 u=b-a;float l=length(u);u/=l;vec3 pa=p-a;float y=dot(pa,u);vec2 d=vec2(length(pa-u*y)-r+.12,abs(y-l*.5)-l*.5-r*.3+.12);return min(max(d.x,d.y),0.)+length(max(d,0.))-.12;}',
  FIG_SHAPES[o.shape||'cross'],
  'vec3 nor(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}',
  'vec3 env(vec3 d){float y=d.y;vec3 c=vec3(.02)+.10*smoothstep(-.6,.9,y);',
  ' c+=2.2*smoothstep(.6,.9,dot(d,normalize(vec3(-.3,.85,.45))));',
  ' c+=.8*smoothstep(.75,1.,dot(d,normalize(vec3(.4,.8,.3))));',
  ' c+=.9*smoothstep(.6,.97,dot(d,normalize(vec3(.75,.45,.45))));',
  ' c+=.35*smoothstep(.3,.9,dot(d,normalize(vec3(0.,-.8,.5))));return c;}',
  'float tx(vec2 u){return texture2D(TX,vec2(u.x,1.-u.y)).r;}',
  'void main(){vec2 fu=gl_FragCoord.xy/R;vec2 uv=(gl_FragCoord.xy-.5*R)/R.y;uv-=G.xy;',
  ' Q=QB(G.z+M.y*.35+.03*sin(T*.4),M.x*.6+.07*sin(T*.3));',
  ' vec3 ro=vec3(0.,0.,6.),rd=normalize(vec3(uv*G.w,-1.));float t=0.,d=1.;',
  ' vec3 bg=mix(BG,TC,tx(fu));',
  ' for(int i=0;i<96;i++){d=map(ro+rd*t);if(d<.001||t>10.)break;t+=d;}',
  o.text?(o.clear?' if(t>10.){float a=tx(fu);gl_FragColor=vec4(TC*a,a);return;}':' if(t>10.){gl_FragColor=vec4(bg,1.);return;}'):' if(t>10.){gl_FragColor=vec4(0.);return;}',  // without a title the canvas is see-through
  ' vec3 p=ro+rd*t,n=nor(p),r=reflect(rd,n);float f=pow(1.-max(dot(n,-rd),0.),2.5);',
  ' vec2 off=refract(rd,n,.72).xy*.09;float tr=tx(fu+off*vec2(R.y/R.x,1.));',
  ' vec3 base=mix(vec3(.035),vec3(.30,.012,.13),P);',
  ' vec3 tint=mix(vec3(1.),vec3(1.,.33,.64),P);',
  ' vec3 col=base+env(r)*tint*(.35+.9*f)+TC*tr*.78*(1.-.5*f);',
  ' gl_FragColor=vec4(col,1.);}'].join('\n');
  function sh(t,s){var x=gl.createShader(t);gl.shaderSource(x,s);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(x);return x}
  var pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs));gl.linkProgram(pr);gl.useProgram(pr);
  var b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  var U={};['R','T','P','M','TC','BG','TX','G'].forEach(function(k){U[k]=gl.getUniformLocation(pr,k)});
  var tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);
  [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,k,gl.LINEAR)});
  [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T].forEach(function(k){gl.texParameteri(gl.TEXTURE_2D,k,gl.CLAMP_TO_EDGE)});
  var tc=document.createElement('canvas'),tctx=tc.getContext('2d');
  function drawText(w,h){
    // the title lives in a texture so the figure can bend it (as in her Spline scene)
    tc.width=w;tc.height=h;tctx.fillStyle='#000';tctx.fillRect(0,0,w,h);
    if(o.text){
      // '|' splits a title into lines (used for narrow screens)
      var L=((o.textM&&w<h*1.6)?o.textM:o.text).split('|'),fz=Math.min(h*(o.size||.245),h*.78/L.length),ff=fontNow();tctx.font='700 '+fz+'px '+ff;
      var tw0=Math.max.apply(null,L.map(function(x){return tctx.measureText(x).width}));if(tw0>w*.9){fz*=w*.9/tw0;tctx.font='700 '+fz+'px '+ff;}
      var cy=h*(h>w&&!o.textM?.4:(o.ty||.475));
      tctx.fillStyle='#fff';tctx.textAlign='center';tctx.textBaseline='middle';
      L.forEach(function(x,i){tctx.fillText(x,w*.5,cy+(i-(L.length-1)/2)*fz*.98)});}
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tc);
  }
  var area=(o.hover&&o.hover.getBoundingClientRect)?o.hover:c.parentElement,m=[0,0],sm=[0,0],pk=0,t0=performance.now(),tw=0,th=0;
  var moved=false,still=matchMedia('(prefers-reduced-motion: reduce)');
  window.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;moved=true;
    // 'viewport': the figure follows the cursor anywhere on the screen
    var r=o.hover==='viewport'?{left:0,top:0,width:innerWidth,height:innerHeight}:area.getBoundingClientRect();if(!r.width)return;
    m=[Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))]});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){tw=0});
  // the title font can be switched live: redraw when it changes or finishes loading
  function fontNow(){return (typeof o.font==='function'?o.font():o.font)||'Oswald'}
  var lastF=fontNow();if(document.fonts&&document.fonts.addEventListener)document.fonts.addEventListener('loadingdone',function(){tw=0});
  function hex(s){s=s.replace('#','');return [0,2,4].map(function(i){return parseInt(s.substr(i,2),16)/255})}
  (function frame(){
    if(!c.isConnected)return;
    var fn=fontNow();if(fn!==lastF){lastF=fn;tw=0}
    var r=c.getBoundingClientRect();
    // draw only while on screen
    if(r.width>0&&r.bottom>0&&r.top<innerHeight&&c.offsetParent){
      var k=Math.min(devicePixelRatio,1.5),w=Math.round(r.width*k),h=Math.round(r.height*k);
      if(c.width!==w||c.height!==h){c.width=w;c.height=h;gl.viewport(0,0,w,h)}
      if(tw!==w||th!==h){drawText(w,h);tw=w;th=h}
      // no mouse (phone): slow sway instead of following the cursor
      if(!moved&&!still.matches){var ts=(performance.now()-t0)/1000;m=[Math.sin(ts*.45)*.45,Math.cos(ts*.33)*.25]}
      sm[0]+=(m[0]-sm[0])*.06;sm[1]+=(m[1]-sm[1])*.06;
      var st=o.state();pk+=(st.pink-pk)*.12;
      var tcol=hex(st.tc||'#ffffff'),bg=hex(o.bg||'#1c1c1c'),g=o.geo||[0,0,-.6,.47];
      gl.uniform2f(U.R,w,h);gl.uniform1f(U.T,still.matches?0:(performance.now()-t0)/1000);gl.uniform1f(U.P,pk);gl.uniform2f(U.M,sm[0],sm[1]);
      gl.uniform3f(U.TC,tcol[0],tcol[1],tcol[2]);gl.uniform3f(U.BG,bg[0],bg[1],bg[2]);gl.uniform1i(U.TX,0);gl.uniform4f(U.G,g[0],g[1]+(h>w&&o.text?.075:0),g[2],g[3]*Math.max(1,h/w*.9));
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    requestAnimationFrame(frame);
  })();
  return true;
}
