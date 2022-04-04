import{r as y,o as t,c as s,a as e,F as u,b as h,d as g,w as b,e as S,f as $,t as c,n as C,R as L,g as k,_ as R,h as N,i as x,j as B}from"./vendor.f9ce4746.js";const P=function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))m(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const d of n.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&m(d)}).observe(document,{childList:!0,subtree:!0});function i(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerpolicy&&(n.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?n.credentials="include":o.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function m(o){if(o.ep)return;o.ep=!0;const n=i(o);fetch(o.href,n)}};P();var v=(l,r)=>{const i=l.__vccOpts||l;for(const[m,o]of r)i[m]=o;return i};const M={props:["races"],data(){return{count:0}},computed:{}},D={class:"navbar navbar-expand-sm navbar-light bg-light"},T={class:"container-fluid"},V=e("div",{class:"navbar-brand",href:"#"},"2022 PCRS",-1),O={class:"collapse navbar-collapse",id:"navbarSupportedContent"},j={class:"navbar-nav me-auto mb-2 mb-lg-0"},A={class:"nav-item dropdown"},q=e("a",{class:"nav-link dropdown-toggle",href:"#",id:"navbarDropdown",role:"button","data-bs-toggle":"dropdown","aria-expanded":"false"}," Races ",-1),F={class:"dropdown-menu","aria-labelledby":"navbarDropdown"},H={key:1,class:"dropdown-item disabled"},I={class:"nav-item"},U=$("Series Results"),E=e("div",{class:"nav-item"},[e("a",{class:"nav-link active","aria-current":"page",href:"https://racemtb.com/"},"RaceMtb Home")],-1);function z(l,r,i,m,o,n){const d=y("RouterLink");return t(),s("nav",D,[e("div",T,[V,e("div",O,[e("ul",j,[e("li",A,[q,e("ul",F,[(t(!0),s(u,null,h(i.races,a=>(t(),s("li",{key:a.raceid},[a.active?(t(),S(d,{key:0,class:C(["dropdown-item",{active:l.$route.params.raceid===a.raceid}]),to:`/race/${a.raceid}`},{default:b(()=>[$(c(a.displayName+` - ${a.formattedStartDate}`),1)]),_:2},1032,["class","to"])):(t(),s("div",H,c(a.displayName+` - ${a.formattedStartDate}`),1))]))),128))])])])]),e("div",I,[g(d,{class:"nav-link",to:"/series/pcrs_2022"},{default:b(()=>[U]),_:1})]),E])])}var K=v(M,[["render",z]]);let W="/api/races/";const G={components:{RouterView:L,NavBar:K},data(){return{races:[]}},mounted:function(){fetch(W).then(l=>l.json()).then(l=>{this.races=l;let r=this.races.find(i=>i.defaultRace===!0);r&&window.location.hash.indexOf("race/")==-1&&this.$router.push(`/race/${r.raceid}`)})},computed:{raceMeta(){return this.races.find(l=>l.raceid===this.$route.params.raceid)}}},J={key:0,class:"text-center"},Q={class:"mt-5"};function X(l,r,i,m,o,n){var f;const d=y("NavBar"),a=y("RouterView");return t(),s(u,null,[g(d,{races:o.races,id:"top"},null,8,["races"]),n.raceMeta?(t(),s("div",J,[e("h2",Q,"Race Results - "+c((f=n.raceMeta)==null?void 0:f.formattedStartDate),1)])):k("",!0),g(a)],64)}var Y=v(G,[["render",X]]);const Z={props:["data","Pos","totLaps"],data(){return{count:0}},computed:{incompleteLaps(){return new Array(this.totLaps-this.data.laps.length).fill("-")}}};function ee(l,r,i,m,o,n){return t(),s(u,null,[e("td",null,c(i.Pos+1),1),e("td",null,c(i.data.Bib),1),e("td",null,c(i.data.Name),1),e("td",null,c(i.data.Sponsor),1),(t(!0),s(u,null,h(i.data.laps,(d,a)=>(t(),s("td",{key:a},c(d.timeString),1))),128)),i.totLaps-i.data.laps.length>0?(t(!0),s(u,{key:0},h(n.incompleteLaps,d=>(t(),s("td",null,c(d),1))),256)):k("",!0),e("td",null,c(i.data.Time),1),e("td",null,c(i.data.back||"-"),1)],64)}var te=v(Z,[["render",ee]]);const se={components:{ResultRow:te},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(l){var r=document.querySelector(`#${l}`);r.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let l=`/api/races/results/${this.$route.params.raceid}`;fetch(l).then(r=>r.json()).then(r=>{this.loading=!1,this.categories=r.categories}).catch(r=>{console.error(r),this.categories={},this.error=r.toString()})}},computed:{sortedCats(){return R.orderBy(this.categories,"disporder")},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},re={key:0,class:"loading"},ae={key:1},oe={key:0,class:"error"},ne={key:1},ie={class:"container text-center mt-5"},le={class:"list-inline"},ce=["onClick"],de={class:"container-fluid"},ue=["id"],he={class:"table table-striped table-hover"},_e={key:2},me=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),pe=[me];function fe(l,r,i,m,o,n){const d=y("ResultRow");return o.loading?(t(),s("div",re,"Loading...")):(t(),s("div",ae,[o.error?(t(),s("div",oe,c(o.error),1)):k("",!0),n.haveResults?(t(),s("div",ne,[e("div",ie,[e("ul",le,[(t(!0),s(u,null,h(n.sortedCats,(a,f)=>(t(),s("li",{key:a.id,class:"list-inline-item"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(a.id),class:"link-primary"},c(a.catdispname),9,ce)]))),128))])]),e("div",de,[(t(!0),s(u,null,h(n.sortedCats,(a,f)=>(t(),s("div",{key:a.id,class:"mt-5"},[e("h3",{id:a.id},c(a.catdispname),9,ue),e("table",he,[e("thead",null,[e("tr",null,[(t(!0),s(u,null,h(a.columns,(_,p)=>(t(),s("th",{scope:"col",key:p},c(_),1))),128))])]),e("tbody",null,[(t(!0),s(u,null,h(a.results,(_,p)=>(t(),s("tr",{key:p},[g(d,{totLaps:a.laps,Pos:p,data:_},null,8,["totLaps","Pos","data"])]))),128))])]),e("a",{role:"button",onClick:r[0]||(r[0]=_=>n.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(t(),s("div",_e,pe))]))}var ve=v(se,[["render",fe]]);const ye={props:["data","Pos"],data(){return{count:0}},computed:{}};function ge(l,r,i,m,o,n){return t(),s(u,null,[e("td",null,c(i.Pos+1),1),e("td",null,c(i.data.Bib),1),e("td",null,c(i.data.Name),1),e("td",null,c(i.data.Sponsor),1),(t(!0),s(u,null,h(i.data.results,(d,a)=>(t(),s("td",{key:a},c(d.resultString),1))),128)),e("td",null,c(i.data.seriesPoints),1)],64)}var ke=v(ye,[["render",ge]]);const be={components:{SeriesResultRow:ke},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(l){var r=document.querySelector(`#${l}`);r.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let l=`/api/series/results/${this.$route.params.seriesid}`;fetch(l).then(r=>r.json()).then(r=>{this.loading=!1,this.categories=r.categories}).catch(r=>{console.error(r),this.categories={},this.error=r.toString()})}},computed:{sortedCats(){return R.orderBy(this.categories,"disporder")},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},$e={key:0,class:"loading"},Re={key:1},we={key:0,class:"error"},Se={key:1},Ce={class:"container text-center mt-5"},Le={class:"list-inline"},Ne=["onClick"],xe={class:"container-fluid"},Be=["id"],Pe={class:"table table-striped table-hover"},Me={key:2},De=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),Te=[De];function Ve(l,r,i,m,o,n){const d=y("SeriesResultRow");return o.loading?(t(),s("div",$e,"Loading...")):(t(),s("div",Re,[o.error?(t(),s("div",we,c(o.error),1)):k("",!0),n.haveResults?(t(),s("div",Se,[e("div",Ce,[e("ul",Le,[(t(!0),s(u,null,h(n.sortedCats,(a,f)=>(t(),s("li",{key:a.id,class:"list-inline-item"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(a.id),class:"link-primary"},c(a.catdispname),9,Ne)]))),128))])]),e("div",xe,[(t(!0),s(u,null,h(n.sortedCats,(a,f)=>(t(),s("div",{key:a.id,class:"mt-5"},[e("h3",{id:a.id},c(a.catdispname),9,Be),e("table",Pe,[e("thead",null,[e("tr",null,[(t(!0),s(u,null,h(a.columns,(_,p)=>(t(),s("th",{scope:"col",key:p},c(_),1))),128))])]),e("tbody",null,[(t(!0),s(u,null,h(a.results,(_,p)=>(t(),s("tr",{key:p},[g(d,{Pos:p,data:_},null,8,["Pos","data"])]))),128))])]),e("a",{role:"button",onClick:r[0]||(r[0]=_=>n.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(t(),s("div",Me,Te))]))}var Oe=v(be,[["render",Ve]]);const je=N({history:x("/"),routes:[{path:"/race/:raceid",component:ve},{path:"/series/:seriesid",component:Oe}]});const w=B(Y);w.use(je);w.mount("#app");
