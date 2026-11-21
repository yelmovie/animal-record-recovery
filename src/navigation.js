// Page history tracks navigation only, never answer changes or modal toggles.
export function createNavigation(){
  let current=null;
  const history=[];
  return {
    // Returns true when the previous page went onto the history (the browser gets a matching entry).
    visit(route){
      if(JSON.stringify(current)===JSON.stringify(route))return false;
      const pushed=!!current;
      if(current)history.push(current);
      if(history.length>50)history.shift();
      current={...route};
      return pushed;
    },
    back(){if(!history.length)return null;current=history.pop();return {...current};},
    reset(route=null){current=route?{...route}:null;history.length=0;},
    get canGoBack(){return history.length>0;},
  };
}
