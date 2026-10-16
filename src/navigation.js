// Page history tracks navigation only, never answer changes or modal toggles.
export function createNavigation(){
  let current=null;
  const history=[];
  return {
    visit(route){
      if(JSON.stringify(current)===JSON.stringify(route))return;
      if(current)history.push(current);
      if(history.length>50)history.shift();
      current={...route};
    },
    back(){if(!history.length)return null;current=history.pop();return {...current};},
    reset(){current=null;history.length=0;},
    get canGoBack(){return history.length>0;},
  };
}
