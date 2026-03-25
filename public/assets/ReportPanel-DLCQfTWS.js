var m=Object.defineProperty;var u=(n,e,t)=>e in n?m(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var a=(n,e,t)=>u(n,typeof e!="symbol"?e+"":e,t);import{t as d,e as p}from"./index-DMxXWqNn.js";import{u as v}from"./uiStore-DHYDY5KE.js";import"./d3-CuXdqget.js";import"./topojson-BwRznoQ3.js";class L{constructor(e){a(this,"container");a(this,"element");a(this,"store",v);this.container=e,this.element=this.createElement(),this.render(),this.bindEvents()}createElement(){const e=document.createElement("div");return e.id="report-panel",e.className="report-panel",e}getElement(){return this.element}render(){const e=this.store.getState(),t=this.renderReports(e.reports),s=e.isGenerating;this.element.innerHTML=`
      <div class="sidebar-header">
        <h3>${d("panels.reports")||"Reports"}</h3>
        <div class="sidebar-actions">
          <button class="sidebar-action-btn" id="panelSettingsBtn" title="Panel Settings">
            ⚙
          </button>
          <button class="sidebar-action-btn" id="newsSourcesBtn" title="News Sources">
            📡
          </button>
          <button class="sidebar-toggle" id="toggle-right-sidebar" title="Toggle">
            <span class="icon">▶</span>
          </button>
        </div>
      </div>
      <div class="report-actions">
        <button class="report-generate-btn" id="generate-tech-report" ${s?"disabled":""}>
          ${d("reports.generateTech")||"Tech Report"}
        </button>
        <button class="report-generate-btn" id="generate-world-report" ${s?"disabled":""}>
          ${d("reports.generateWorld")||"World Report"}
        </button>
      </div>
      <div class="report-list" id="report-list">
        ${e.isLoading?'<div class="report-loading">Loading...</div>':t}
      </div>
      ${e.currentReport?this.renderCurrentReport(e.currentReport):""}
    `}renderReports(e){return e.length===0?'<div class="report-empty">No reports yet</div>':e.map(t=>{const s=new Date(t.created_at).toLocaleDateString(),i=t.category?`<span class="report-category">${t.category}</span>`:"";return`
        <div class="report-item" data-id="${t.id}">
          <div class="report-item-header">
            <span class="report-item-title">${p(t.title)}</span>
            ${i}
          </div>
          <div class="report-item-meta">
            <span class="report-item-date">${s}</span>
          </div>
        </div>
      `}).join("")}renderCurrentReport(e){return`
      <div class="report-detail" id="report-detail">
        <div class="report-detail-header">
          <h4>${p(e.title)}</h4>
          <button class="report-detail-close" id="close-report-detail">✕</button>
        </div>
        <div class="report-detail-content">
          ${e.content?p(e.content):"No content available"}
        </div>
      </div>
    `}bindEvents(){const e=this.element.querySelector("#generate-tech-report");e==null||e.addEventListener("click",()=>{this.store.getState().generateReport("tech")});const t=this.element.querySelector("#generate-world-report");t==null||t.addEventListener("click",()=>{this.store.getState().generateReport("world")});const s=this.element.querySelector("#panelSettingsBtn");s==null||s.addEventListener("click",()=>{const r=document.getElementById("settingsModal");r&&r.classList.add("active")});const i=this.element.querySelector("#newsSourcesBtn");i==null||i.addEventListener("click",()=>{const r=document.getElementById("sourcesModal");r&&r.classList.add("active")});const o=this.element.querySelector("#toggle-right-sidebar");o==null||o.addEventListener("click",()=>{this.element.classList.toggle("collapsed");const r=o.querySelector(".icon");r&&(r.textContent=this.element.classList.contains("collapsed")?"◀":"▶")});const l=this.element.querySelector("#report-list");l==null||l.addEventListener("click",async r=>{const g=r.target.closest(".report-item");if(g){const h=parseInt(g.dataset.id||"0");h&&(await this.store.getState().fetchReport(h),this.render())}});const c=this.element.querySelector("#close-report-detail");c==null||c.addEventListener("click",()=>{this.store.getState().setCurrentReport(null),this.render()}),this.store.subscribe(()=>{this.render()})}mount(){this.container.appendChild(this.getElement()),this.store.getState().fetchReports()}destroy(){this.element.remove()}}export{L as ReportPanel,L as default};
