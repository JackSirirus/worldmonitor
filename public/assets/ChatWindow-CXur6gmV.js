var c=Object.defineProperty;var o=(n,e,t)=>e in n?c(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var r=(n,e,t)=>o(n,typeof e!="symbol"?e+"":e,t);import{t as i,e as l}from"./index-DUNX4n30.js";import{a as d}from"./uiStore-kPAzpNML.js";import"./d3-CuXdqget.js";import"./topojson-BwRznoQ3.js";class v{constructor(e){r(this,"container");r(this,"element");r(this,"store",d);this.container=e,this.element=this.createElement(),this.render(),this.bindEvents()}createElement(){const e=document.createElement("div");return e.id="chat-window",e.className="chat-window",e}getElement(){return this.element}render(){const e=this.store.getState(),t=e.messages.map(a=>this.renderMessage(a)).join("");this.element.innerHTML=`
      <div class="chat-header">
        <h3>${i("panels.aiChat")||"AI Assistant"}</h3>
        <button class="chat-clear-btn" id="chat-clear" title="${i("buttons.clear")||"Clear"}">
          🗑️
        </button>
      </div>
      <div class="chat-messages" id="chat-messages">
        ${e.messages.length===0?`
          <div class="chat-welcome">
            <p>${i("chat.welcome")||"Ask me about world events, news analysis, or generate reports."}</p>
          </div>
        `:t}
      </div>
      <div class="chat-input-container">
        <input
          type="text"
          id="chat-input"
          class="chat-input"
          placeholder="${i("chat.placeholder")||"Ask a question..."}"
          ${e.isLoading?"disabled":""}
        />
        <button class="chat-send-btn" id="chat-send" ${e.isLoading?"disabled":""}>
          ${e.isLoading?"⏳":"➤"}
        </button>
      </div>
    `;const s=this.element.querySelector("#chat-messages");s&&(s.scrollTop=s.scrollHeight)}renderMessage(e){const t=e.timestamp.toLocaleTimeString(),s=e.role==="user"?"user":"assistant",a=e.isLoading?"loading":"";return`
      <div class="chat-message ${s} ${a}">
        <div class="chat-message-header">
          <span class="chat-message-role">${e.role==="user"?i("chat.you")||"You":"AI"}</span>
          <span class="chat-message-time">${t}</span>
        </div>
        <div class="chat-message-content">
          ${e.isLoading?`
            <span class="typing-indicator">
              <span>.</span><span>.</span><span>.</span>
            </span>
          `:this.formatContent(e.content)}
        </div>
      </div>
    `}formatContent(e){let t=l(e);return t=t.replace(/```(\w*)\n([\s\S]*?)```/g,"<pre><code>$2</code></pre>"),t=t.replace(/`([^`]+)`/g,"<code>$1</code>"),t=t.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),t=t.replace(/\n/g,"<br>"),t}bindEvents(){const e=this.element.querySelector("#chat-send");e==null||e.addEventListener("click",()=>this.handleSend());const t=this.element.querySelector("#chat-input");t==null||t.addEventListener("keydown",a=>{a.key==="Enter"&&!a.shiftKey&&(a.preventDefault(),this.handleSend())});const s=this.element.querySelector("#chat-clear");s==null||s.addEventListener("click",()=>{this.store.getState().clearMessages(),this.render()}),this.store.subscribe(()=>{this.render()})}handleSend(){const e=this.element.querySelector("#chat-input"),t=e==null?void 0:e.value.trim();t&&(e.value="",this.store.getState().sendMessage(t))}mount(){this.container.appendChild(this.getElement())}destroy(){this.element.remove()}}export{v as ChatWindow,v as default};
