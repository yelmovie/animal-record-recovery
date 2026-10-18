// Keep dynamic Korean labels grammatical without displaying 은(는) / 을(를).
export function withParticle(word,pair='을/를'){
  const text=String(word??''),last=text.trim().replace(/[”’'"\)\]]+$/u,'').at(-1)||'';
  const code=last.charCodeAt(0),final=code>=0xac00&&code<=0xd7a3?(code-0xac00)%28:0;
  const [closed,open]=pair.split('/');return text+(pair==='으로/로'&&final===8?open:final?closed:open);
}
