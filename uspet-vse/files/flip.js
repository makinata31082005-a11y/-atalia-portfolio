// Flip cards: each .uc-flip has a .uc-flip-back at the same spot; hover (or tap) turns the pair over.
window.flip={init:function(sel){
  document.querySelectorAll(sel).forEach(function(front){
    var p=function(e,k){return e.getAttribute('data-field-'+k+'-value')};
    var back=[].find.call(front.closest('.t-rec').querySelectorAll('.uc-flip-back'),function(b){return p(b,'top')==p(front,'top')&&p(b,'left')==p(front,'left')});
    if(!back) return;
    var pair=[front,back], on=function(v){pair.forEach(function(e){e.classList.toggle('is-flipped',v)})};
    pair.forEach(function(e){
      e.style.pointerEvents='auto';
      e.addEventListener('mouseenter',function(){on(true)});
      e.addEventListener('mouseleave',function(ev){if(pair.indexOf(ev.relatedTarget&&ev.relatedTarget.closest('.tn-elem'))<0)on(false)});
      e.addEventListener('click',function(){on(!front.classList.contains('is-flipped'))});
    });
  });
}};
document.addEventListener('DOMContentLoaded',function(){flip.init('.uc-flip')});
