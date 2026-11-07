"use client";
import { useMemo, useState, type ComponentType } from "react";
import { Backspace, CornerDownLeft, Delete, Smile, ChevronUp, Send, Crown, Flame, Ghost, Zap, Moon, Gem, Music2, Eye, Swords, Heart, Sparkles } from "lucide-react";

type Props={value:string;onChange:(value:string)=>void;onSubmit?:()=>void;placeholder?:string;multiline?:boolean;disabled?:boolean};
const rows=["qwertyuiop","asdfghjkl","zxcvbnm"];
const quickIcons: [string, ComponentType<{size?:number}>, string][]=[["Royalty",Crown,"♛"],["Fire",Flame,"🔥"],["Phantom",Ghost,"👻"],["Electric",Zap,"ϟ"],["Night Owl",Moon,"☾"],["Elite",Gem,"◇"],["Sound",Music2,"♫"],["Observer",Eye,"◎"],["Warrior",Swords,"⚔"],["Icon",Sparkles,"✦"],["Lover",Heart,"♡"]];
export default function NochalantKeyboard({value,onChange,onSubmit,placeholder="Write something…",multiline=false,disabled=false}:Props){
 const [open,setOpen]=useState(false),[mode,setMode]=useState<"letters"|"numbers"|"symbols"|"icons">("letters"),[shift,setShift]=useState(false);
 const lastWord=useMemo(()=>value.split(/\s/).at(-1)||"",[value]);
 function insert(text:string){onChange(value+text)}
 function backspace(){onChange(value.slice(0,-1))}
 function key(k:string){insert(shift?k.toUpperCase():k);setShift(false)}\n function handlePhysicalKey(e:React.KeyboardEvent<HTMLTextAreaElement>){if(e.key==="Backspace"){e.preventDefault();backspace();return;}if(e.key==="Enter"){if(multiline){e.preventDefault();insert("\\n");}else{e.preventDefault();onSubmit?.();setOpen(false);}return;}if(e.key===" "){e.preventDefault();insert(" ");return;}if(e.key.length===1&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();key(e.key);}}
 return <div className="nochalant-keys-wrap">
  <div className="nochalant-input-row">
   <button type="button" className="nk-tool" aria-label="Open Nochalant icons" onClick={()=>{setOpen(true);setMode("icons")}}><Smile size={20}/></button>
   <textarea aria-label="Message" rows={1} readOnly value={value} placeholder={placeholder} onClick={()=>{setOpen(true);setMode("letters")}} onFocus={()=>setOpen(true)} onKeyDown={handlePhysicalKey} className="nochalant-message-preview"/>
   <button type="button" className="nk-send" disabled={disabled||!value.trim()} onClick={()=>{onSubmit?.();setOpen(false)}} aria-label="Send message"><Send size={18}/></button>
  </div>
  {open&&<section className="nochalant-keyboard" aria-label="Nochalant custom keyboard">
   <div className="nk-suggestions"><button type="button" onClick={()=>insert("I ")}>{lastWord?lastWord.charAt(0).toUpperCase()+lastWord.slice(1):"I"}</button><span>{lastWord?lastWord.toUpperCase():"You"}</span><button type="button" onClick={()=>insert("The ")}>{lastWord?"✨":"Three"}</button><button type="button" className="nk-close" onClick={()=>setOpen(false)}>⌄</button></div>
   {mode==="icons"?<div className="nk-icon-panel">{quickIcons.map(([name,Icon,glyph])=><button type="button" key={String(name)} onClick={()=>insert(" "+String(glyph)+" ")}><Icon size={24}/><small>{String(name)}</small></button>)}</div>:<div className="nk-keys">
    {(mode==="letters"?rows:mode==="numbers"?["1234567890","@#$%&-*+()","!\"':;/?"]:["~`|•√π÷×¶∆","£¢€¥^°={}\\","%©®™✓[]<>"]).map((row,index)=><div className={"nk-key-row nk-row-"+index} key={row}>{row.split("").map(k=><button type="button" className="nk-key" key={k} onClick={()=>key(k)}>{shift?k.toUpperCase():k}</button>)}{mode==="letters"&&index===2&&<button type="button" className="nk-special" aria-label="Backspace" onClick={backspace}><Backspace size={22}/></button>}</div>)}
    <div className="nk-bottom-row"><button type="button" className="nk-special nk-mode" onClick={()=>setMode(mode==="letters"?"numbers":mode==="numbers"?"symbols":"letters")}>{mode==="letters"?"123":mode==="numbers"?"#+=":"ABC"}</button><button type="button" className="nk-special nk-emoji" onClick={()=>setMode("icons")}><Smile size={23}/></button><button type="button" className="nk-key nk-space" onClick={()=>insert(" ")}>space <small>EN</small></button><button type="button" className="nk-special nk-enter" onClick={()=>multiline?insert("\\n"):onSubmit?.()}><CornerDownLeft size={25}/></button></div>
   </div>}
   <div className="nk-footer"><button type="button" onClick={()=>setShift(!shift)}><ChevronUp size={15}/> Shift</button><span>NOCHALANT KEYS</span><button type="button" onClick={backspace}><Delete size={15}/> Delete</button></div>
  </section>}
 </div>
}
