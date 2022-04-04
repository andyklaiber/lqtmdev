import{r as y,o as t,c as s,a as e,F as u,b as h,d as g,w as b,e as S,f as $,t as c,n as C,R as L,g as k,_ as R,h as N,i as x,j as B}from"./vendor.f9ce4746.js";const P=function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))m(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const d of n.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&m(d)}).observe(document,{childList:!0,subtree:!0});function i(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerpolicy&&(n.referrerPolicy=a.referrerpolicy),a.crossorigin==="use-credentials"?n.credentials="include":a.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function m(a){if(a.ep)return;a.ep=!0;const n=i(a);fetch(a.href,n)}};P();var v=(l,r)=>{const i=l.__vccOpts||l;for(const[m,a]of r)i[m]=a;return i};const M={props:["races"],data(){return{count:0}},computed:{}},D={class:"navbar navbar-expand-sm navbar-light bg-light"},T={class:"container-fluid"},V=e("div",{class:"navbar-brand",href:"#"},"2022 PCRS",-1),O={class:"collapse navbar-collapse",id:"navbarSupportedContent"},j={class:"navbar-nav me-auto mb-2 mb-lg-0"},A={class:"nav-item dropdown"},q=e("a",{class:"nav-link dropdown-toggle",href:"#",id:"navbarDropdown",role:"button","data-bs-toggle":"dropdown","aria-expanded":"false"}," Races ",-1),F={class:"dropdown-menu","aria-labelledby":"navbarDropdown"},H={key:1,class:"dropdown-item disabled"},I=$("Series Results"),U=e("div",{class:"nav-item"},[e("a",{class:"nav-link active","aria-current":"page",href:"https://racemtb.com/"},"RaceMtb Home")],-1);function E(l,r,i,m,a,n){const d=y("RouterLink");return t(),s("nav",D,[e("div",T,[V,e("div",O,[e("ul",j,[e("li",A,[q,e("ul",F,[(t(!0),s(u,null,h(i.races,o=>(t(),s("li",{key:o.raceid},[o.active?(t(),S(d,{key:0,class:C(["dropdown-item",{active:l.$route.params.raceid===o.raceid}]),to:`/race/${o.raceid}`},{default:b(()=>[$(c(o.displayName+` - ${o.formattedStartDate}`),1)]),_:2},1032,["class","to"])):(t(),s("div",H,c(o.displayName+` - ${o.formattedStartDate}`),1))]))),128))])]),e("li",null,[g(d,{to:"/series/pcrs_2022"},{default:b(()=>[I]),_:1})])])]),U])])}var z=v(M,[["render",E]]);let K="/api/races/";const W={components:{RouterView:L,NavBar:z},data(){return{races:[]}},mounted:function(){fetch(K).then(l=>l.json()).then(l=>{this.races=l;let r=this.races.find(i=>i.defaultRace===!0);r&&window.location.hash.indexOf("race/")==-1&&this.$router.push(`/race/${r.raceid}`)})},computed:{raceMeta(){return this.races.find(l=>l.raceid===this.$route.params.raceid)}}},G={key:0,class:"text-center"},J={class:"mt-5"};function Q(l,r,i,m,a,n){var f;const d=y("NavBar"),o=y("RouterView");return t(),s(u,null,[g(d,{races:a.races,id:"top"},null,8,["races"]),n.raceMeta?(t(),s("div",G,[e("h2",J,"Race Results - "+c((f=n.raceMeta)==null?void 0:f.formattedStartDate),1)])):k("",!0),g(o)],64)}var X=v(W,[["render",Q]]);const Y={props:["data","Pos","totLaps"],data(){return{count:0}},computed:{incompleteLaps(){return new Array(this.totLaps-this.data.laps.length).fill("-")}}};function Z(l,r,i,m,a,n){return t(),s(u,null,[e("td",null,c(i.Pos+1),1),e("td",null,c(i.data.Bib),1),e("td",null,c(i.data.Name),1),e("td",null,c(i.data.Sponsor),1),(t(!0),s(u,null,h(i.data.laps,(d,o)=>(t(),s("td",{key:o},c(d.timeString),1))),128)),i.totLaps-i.data.laps.length>0?(t(!0),s(u,{key:0},h(n.incompleteLaps,d=>(t(),s("td",null,c(d),1))),256)):k("",!0),e("td",null,c(i.data.Time),1),e("td",null,c(i.data.back||"-"),1)],64)}var ee=v(Y,[["render",Z]]);const te={components:{ResultRow:ee},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(l){var r=document.querySelector(`#${l}`);r.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let l=`/api/races/results/${this.$route.params.raceid}`;fetch(l).then(r=>r.json()).then(r=>{this.loading=!1,this.categories=r.categories}).catch(r=>{console.error(r),this.categories={},this.error=r.toString()})}},computed:{sortedCats(){return R.orderBy(this.categories,"disporder")},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},se={key:0,class:"loading"},re={key:1},oe={key:0,class:"error"},ae={key:1},ne={class:"container text-center mt-5"},ie={class:"list-inline"},le=["onClick"],ce={class:"container-fluid"},de=["id"],ue={class:"table table-striped table-hover"},he={key:2},_e=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),me=[_e];function pe(l,r,i,m,a,n){const d=y("ResultRow");return a.loading?(t(),s("div",se,"Loading...")):(t(),s("div",re,[a.error?(t(),s("div",oe,c(a.error),1)):k("",!0),n.haveResults?(t(),s("div",ae,[e("div",ne,[e("ul",ie,[(t(!0),s(u,null,h(n.sortedCats,(o,f)=>(t(),s("li",{key:o.id,class:"list-inline-item"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(o.id),class:"link-primary"},c(o.catdispname),9,le)]))),128))])]),e("div",ce,[(t(!0),s(u,null,h(n.sortedCats,(o,f)=>(t(),s("div",{key:o.id,class:"mt-5"},[e("h3",{id:o.id},c(o.catdispname),9,de),e("table",ue,[e("thead",null,[e("tr",null,[(t(!0),s(u,null,h(o.columns,(_,p)=>(t(),s("th",{scope:"col",key:p},c(_),1))),128))])]),e("tbody",null,[(t(!0),s(u,null,h(o.results,(_,p)=>(t(),s("tr",{key:p},[g(d,{totLaps:o.laps,Pos:p,data:_},null,8,["totLaps","Pos","data"])]))),128))])]),e("a",{role:"button",onClick:r[0]||(r[0]=_=>n.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(t(),s("div",he,me))]))}var fe=v(te,[["render",pe]]);const ve={props:["data","Pos"],data(){return{count:0}},computed:{}};function ye(l,r,i,m,a,n){return t(),s(u,null,[e("td",null,c(i.Pos+1),1),e("td",null,c(i.data.Bib),1),e("td",null,c(i.data.Name),1),e("td",null,c(i.data.Sponsor),1),(t(!0),s(u,null,h(i.data.results,(d,o)=>(t(),s("td",{key:o},c(d.resultString),1))),128)),e("td",null,c(i.data.seriesPoints),1)],64)}var ge=v(ve,[["render",ye]]);const ke={components:{SeriesResultRow:ge},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(l){var r=document.querySelector(`#${l}`);r.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let l=`/api/series/results/${this.$route.params.seriesid}`;fetch(l).then(r=>r.json()).then(r=>{this.loading=!1,this.categories=r.categories}).catch(r=>{console.error(r),this.categories={},this.error=r.toString()})}},computed:{sortedCats(){return R.orderBy(this.categories,"disporder")},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},be={key:0,class:"loading"},$e={key:1},Re={key:0,class:"error"},we={key:1},Se={class:"container text-center mt-5"},Ce={class:"list-inline"},Le=["onClick"],Ne={class:"container-fluid"},xe=["id"],Be={class:"table table-striped table-hover"},Pe={key:2},Me=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),De=[Me];function Te(l,r,i,m,a,n){const d=y("SeriesResultRow");return a.loading?(t(),s("div",be,"Loading...")):(t(),s("div",$e,[a.error?(t(),s("div",Re,c(a.error),1)):k("",!0),n.haveResults?(t(),s("div",we,[e("div",Se,[e("ul",Ce,[(t(!0),s(u,null,h(n.sortedCats,(o,f)=>(t(),s("li",{key:o.id,class:"list-inline-item"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(o.id),class:"link-primary"},c(o.catdispname),9,Le)]))),128))])]),e("div",Ne,[(t(!0),s(u,null,h(n.sortedCats,(o,f)=>(t(),s("div",{key:o.id,class:"mt-5"},[e("h3",{id:o.id},c(o.catdispname),9,xe),e("table",Be,[e("thead",null,[e("tr",null,[(t(!0),s(u,null,h(o.columns,(_,p)=>(t(),s("th",{scope:"col",key:p},c(_),1))),128))])]),e("tbody",null,[(t(!0),s(u,null,h(o.results,(_,p)=>(t(),s("tr",{key:p},[g(d,{Pos:p,data:_},null,8,["Pos","data"])]))),128))])]),e("a",{role:"button",onClick:r[0]||(r[0]=_=>n.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(t(),s("div",Pe,De))]))}var Ve=v(ke,[["render",Te]]);const Oe=N({history:x("/"),routes:[{path:"/race/:raceid",component:fe},{path:"/series/:seriesid",component:Ve}]});const w=B(X);w.use(Oe);w.mount("#app");
