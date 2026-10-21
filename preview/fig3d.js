// One material for every 3D figure: dark glossy glass that bends whatever is drawn behind it
// (the hero title), turns toward the cursor and can be recoloured pink.
var FIG_SHAPES={
  // her Spline figure: three rounded cylinders melted into a cross, seen at an angle
  cross:'mat3 QB(float th,float ya){return rz(.785)*rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float k=.36;return smin(smin(cyl(p,.40,1.45,.15),cyl(p.yxz,.40,1.45,.15),k),cyl(p.xzy,.5,1.5,.5),k);}',
  // statistics: three soft columns of a bar chart on one base
  bars:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float d=rbox(p-vec3(0.,-1.,0.),vec3(1.35,.12,.5),.12);'+
    'd=smin(d,cyl(p-vec3(-.85,-.45,0.),.32,.6,.3),.18);d=smin(d,cyl(p-vec3(0.,.05,0.),.32,1.1,.3),.18);d=smin(d,cyl(p-vec3(.85,-.2,0.),.32,.85,.3),.18);return d;}',
  // interviews: a speech bubble with a tail
  bubble:'mat3 QB(float th,float ya){return rz(-.1)*rx(th)*ry(ya+.35);}'+
    'float map(vec3 p){p=Q*p;float d=ell(p-vec3(0.,.25,0.),vec3(1.2,.78,.42));'+
    'd=smin(d,cap(p,vec3(-.4,-.15,0.),vec3(-.85,-.95,0.),.17),.3);return d;}',
  // teachers' opinion: two stools ("сидеть на двух стульях")
  stools:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float stool(vec3 p,float h){float d=cyl(p-vec3(0.,h,0.),.55,.15,.14);'+
    'for(int i=0;i<3;i++){float a=float(i)*2.094+.5;vec3 f=vec3(.48*cos(a),-1.,.48*sin(a));d=smin(d,cap(p,vec3(f.x*.6,h,f.z*.6),f,.12),.1);}return d;}'+
    'float map(vec3 p){p=Q*p;return smin(stool(p-vec3(-.65,0.,0.),.25),stool(p-vec3(.65,0.,0.),-.15),.2);}',
  // time management: hourglass
  hourglass:'mat3 QB(float th,float ya){return rz(.35)*rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float y=clamp(p.y,-1.,1.);float r=.16+.6*y*y;float d=(length(p.xz)-r)*.6;d=smax(d,abs(p.y)-1.05,.1);'+
    'd=smin(d,cyl(p-vec3(0.,1.12,0.),.82,.12,.1),.12);d=smin(d,cyl(p+vec3(0.,1.12,0.),.82,.12,.1),.12);return d;}',
  // calm: three balanced pebbles
  pebbles:'mat3 QB(float th,float ya){return rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float d=ell(p-vec3(0.,-.75,0.),vec3(1.05,.36,.8));'+
    'd=smin(d,ell(p-vec3(.08,-.08,0.),vec3(.78,.3,.6)),.14);d=smin(d,ell(p-vec3(-.04,.5,0.),vec3(.5,.26,.42)),.12);'+
    'd=smin(d,ell(p-vec3(.02,.93,0.),vec3(.26,.18,.24)),.1);return d;}',
  // rights: a judge's gavel
  gavel:'mat3 QB(float th,float ya){return rz(.5)*rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;float d=cyl((p-vec3(0.,.55,0.)).yxz,.38,.66,.16);'+
    'd=smin(d,cap(p,vec3(0.,.55,0.),vec3(0.,-1.3,0.),.14),.14);return d;}',
  // job search: a magnifying glass
  lens:'mat3 QB(float th,float ya){return rz(-.6)*rx(th)*ry(ya);}'+
    'float map(vec3 p){p=Q*p;vec3 q=p-vec3(0.,.4,0.);float d=tor(q.xzy,vec2(.7,.2));'+
    'd=smin(d,cap(p,vec3(0.,-.42,0.),vec3(0.,-1.45,0.),.2),.16);return d;}'
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
  o.text?' if(t>10.){gl_FragColor=vec4(bg,1.);return;}':' if(t>10.){gl_FragColor=vec4(0.);return;}',  // without a title the canvas is see-through
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
    if(o.text){var fz=h*(o.size||.245);tctx.font='700 '+fz+'px '+(o.font||'Oswald');
      var tw0=tctx.measureText(o.text).width;if(tw0>w*.9){fz*=w*.9/tw0;tctx.font='700 '+fz+'px '+(o.font||'Oswald');}
      tctx.fillStyle='#fff';tctx.textAlign='center';tctx.textBaseline='middle';tctx.fillText(o.text,w*.5,h*(h>w?.4:(o.ty||.475)));}
    gl.bindTexture(gl.TEXTURE_2D,tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,tc);
  }
  var area=(o.hover&&o.hover.getBoundingClientRect)?o.hover:c.parentElement,m=[0,0],sm=[0,0],pk=0,t0=performance.now(),tw=0,th=0;
  var moved=false;
  window.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;moved=true;
    // 'viewport': the figure follows the cursor anywhere on the screen
    var r=o.hover==='viewport'?{left:0,top:0,width:innerWidth,height:innerHeight}:area.getBoundingClientRect();if(!r.width)return;
    m=[Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1))]});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){tw=0});
  function hex(s){s=s.replace('#','');return [0,2,4].map(function(i){return parseInt(s.substr(i,2),16)/255})}
  (function frame(){
    if(!c.isConnected)return;
    var r=c.getBoundingClientRect();
    // draw only while on screen
    if(r.width>0&&r.bottom>0&&r.top<innerHeight&&c.offsetParent){
      var k=Math.min(devicePixelRatio,1.5),w=Math.round(r.width*k),h=Math.round(r.height*k);
      if(c.width!==w||c.height!==h){c.width=w;c.height=h;gl.viewport(0,0,w,h)}
      if(tw!==w||th!==h){drawText(w,h);tw=w;th=h}
      // no mouse (phone): slow sway instead of following the cursor
      if(!moved){var ts=(performance.now()-t0)/1000;m=[Math.sin(ts*.45)*.45,Math.cos(ts*.33)*.25]}
      sm[0]+=(m[0]-sm[0])*.06;sm[1]+=(m[1]-sm[1])*.06;
      var st=o.state();pk+=(st.pink-pk)*.12;
      var tcol=hex(st.tc||'#ffffff'),bg=hex(o.bg||'#1c1c1c'),g=o.geo||[0,0,-.6,.47];
      gl.uniform2f(U.R,w,h);gl.uniform1f(U.T,(performance.now()-t0)/1000);gl.uniform1f(U.P,pk);gl.uniform2f(U.M,sm[0],sm[1]);
      gl.uniform3f(U.TC,tcol[0],tcol[1],tcol[2]);gl.uniform3f(U.BG,bg[0],bg[1],bg[2]);gl.uniform1i(U.TX,0);gl.uniform4f(U.G,g[0],g[1]+(h>w&&o.text?.075:0),g[2],g[3]*Math.max(1,h/w*.9));
      gl.drawArrays(gl.TRIANGLES,0,3);
    }
    requestAnimationFrame(frame);
  })();
  return true;
}
