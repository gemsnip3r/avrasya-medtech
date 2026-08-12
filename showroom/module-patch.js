(function(){
  const base=window.patchAvrasyaHtml;
  window.patchAvrasyaHtml=function(html){
    html=base(html);
    const from="implantStageImg: 'assets/implant-planning.jpg',";
    const to="implantStageImg: ({1:'assets/implant-1.jpg',2:'assets/implant-2.jpg',3:'assets/implant-3.jpg',4:'assets/implant-4.jpg'}[s.implantStage] || 'assets/implant-planning.jpg'),";
    const i=html.indexOf(from);
    if(i<0||html.indexOf(from,i+from.length)>=0)throw new Error('Source patch mismatch: implant stage visual');
    return html.replace(from,to);
  };
})();
