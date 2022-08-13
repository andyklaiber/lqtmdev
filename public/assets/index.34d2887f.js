import{r as k,o as s,c as r,a as e,F as d,b as h,d as y,n as b,w as R,e as w,f as $,t as a,R as T,g as C,_ as f,h as N,i as M,j as P}from"./vendor.9e377b4a.js";const L=function(){const l=document.createElement("link").relList;if(l&&l.supports&&l.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))p(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const u of n.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&p(u)}).observe(document,{childList:!0,subtree:!0});function c(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerpolicy&&(n.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?n.credentials="include":o.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function p(o){if(o.ep)return;o.ep=!0;const n=c(o);fetch(o.href,n)}};L();var g=(i,l)=>{const c=i.__vccOpts||i;for(const[p,o]of l)c[p]=o;return c};const O={props:["races"],data(){return{count:0}},computed:{}},D=w('<nav id="top" class="navbar navbar-light bg-light"><div class="container-fluid"><div class="navbar-brand" href="#">2022 Prairie City Race Series</div><div class="nav-item"><a class="nav-link active" aria-current="page" href="https://racemtb.com/">RaceMtb Home</a></div></div></nav><p class="mt-3">View Weekly lap times:</p>',2),B={class:"nav nav-tabs mt-1 justify-content-center"},V={class:"nav-item"},j=$("Series Standings"),U={class:"nav-item"},A=$("Grom Series Standings"),H={class:"nav-item"},q=$("Team Competition");function I(i,l,c,p,o,n){const u=k("RouterLink");return s(),r(d,null,[D,e("ul",B,[(s(!0),r(d,null,h(c.races,t=>(s(),r("li",{key:t.raceid,class:"nav-item"},[y(u,{class:b(["nav-link",{active:i.$route.params.raceid===t.raceid}]),to:`/race/${t.raceid}`},{default:R(()=>[$(a(t.displayName+` - ${t.formattedStartDate}`),1)]),_:2},1032,["class","to"])]))),128)),e("li",V,[y(u,{class:b(["nav-link",{active:i.$route.path=="/series/pcrs_2022"}]),to:"/series/pcrs_2022"},{default:R(()=>[j]),_:1},8,["class"])]),e("li",U,[y(u,{class:b(["nav-link",{active:i.$route.path=="/series/grom/pcrs_2022"}]),to:"/series/grom/pcrs_2022"},{default:R(()=>[A]),_:1},8,["class"])]),e("li",H,[y(u,{class:b(["nav-link",{active:i.$route.path=="/teamcomp/pcrs_2022"}]),to:"/teamcomp/pcrs_2022"},{default:R(()=>[q]),_:1},8,["class"])])])],64)}var F=g(O,[["render",I]]);let E="/api/races/";const G={components:{RouterView:T,NavBar:F},data(){return{races:[]}},mounted:function(){fetch(E).then(i=>i.json()).then(i=>{this.races=i,window.location.hash.indexOf("race/")==-1&&this.$router.push("/series/pcrs_2022")})},computed:{raceMeta(){return this.races.find(i=>i.raceid===this.$route.params.raceid)}}},W={key:0,class:"text-center"},z={class:"mt-5"};function K(i,l,c,p,o,n){var m;const u=k("NavBar"),t=k("RouterView");return s(),r(d,null,[y(u,{races:o.races},null,8,["races"]),n.raceMeta?(s(),r("div",W,[e("h2",z,"Race Results - "+a((m=n.raceMeta)==null?void 0:m.formattedStartDate),1)])):C("",!0),y(t)],64)}var J=g(G,[["render",K]]);let Q=i=>{const l=new Date(Date.UTC(0,0,0,0,0,0,i));let p=[l.getUTCMinutes(),l.getUTCSeconds()].map(o=>String(o).padStart(2,"0")).join(":");return l.getUTCHours()&&(p=l.getUTCHours()+":"+p),p};const X={props:["data","Pos","totLaps"],data(){return{count:0}},computed:{incompleteLaps(){return new Array(this.totLaps-this.data.laps.length).fill("-")},formattedTime(){return Q(this.data.duration)}}};function Y(i,l,c,p,o,n){return s(),r(d,null,[e("td",null,a(c.Pos+1),1),e("td",null,a(c.data.Bib),1),e("td",null,a(c.data.Name),1),e("td",null,a(c.data.Sponsor),1),(s(!0),r(d,null,h(c.data.laps,(u,t)=>(s(),r("td",{key:t},a(u.timeString),1))),128)),c.totLaps-c.data.laps.length>0?(s(!0),r(d,{key:0},h(n.incompleteLaps,u=>(s(),r("td",null,a(u),1))),256)):C("",!0),e("td",null,a(n.formattedTime),1),e("td",null,a(c.data.back||"-"),1)],64)}var Z=g(X,[["render",Y]]);const ee={components:{ResultRow:Z},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(i){var l=document.querySelector(`#${i}`);l.scrollIntoView({behavior:"smooth"})},fetchData(){if(this.error=null,this.loading=!0,this.$route.params.raceid){let i=`/api/races/results/${this.$route.params.raceid}`;fetch(i).then(l=>l.json()).then(l=>{this.loading=!1,this.categories=l.categories}).catch(l=>{console.error(l),this.categories={},this.error=l.toString()})}}},computed:{sortedCats(){return f.orderBy(this.categories,"disporder")},expertCats(){return f.filter(this.sortedCats,{laps:4})},sportCats(){return f.filter(this.sortedCats,{laps:3})},beginnerCats(){return f.filter(this.sortedCats,{laps:2})},gromCats(){return f.filter(this.categories,i=>i.id.indexOf("grom")>-1)},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},te={key:0,class:"loading"},se={key:1},re={key:0,class:"error"},le={key:1},ne={class:"container text-center mt-5"},ie={class:"list-inline"},ae=["onClick"],oe={class:"list-inline"},ce=["onClick"],de={class:"list-inline"},ue=["onClick"],he={class:"list-inline"},_e=["onClick"],me={class:"container-fluid"},pe=["id"],fe={class:"table table-striped table-hover"},ve={key:2},ye=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),ge=[ye];function ke(i,l,c,p,o,n){const u=k("ResultRow");return o.loading?(s(),r("div",te,"Loading...")):(s(),r("div",se,[o.error?(s(),r("div",re,a(o.error),1)):C("",!0),n.haveResults?(s(),r("div",le,[e("div",ne,[e("ul",ie,[(s(!0),r(d,null,h(n.expertCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,ae)]))),128))]),e("ul",oe,[(s(!0),r(d,null,h(n.sportCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,ce)]))),128))]),e("ul",de,[(s(!0),r(d,null,h(n.beginnerCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,ue)]))),128))]),e("ul",he,[(s(!0),r(d,null,h(n.gromCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,_e)]))),128))])]),e("div",me,[(s(!0),r(d,null,h(n.sortedCats,(t,m)=>(s(),r("div",{key:t.id,class:"mt-5"},[e("h3",{id:t.id},a(t.catdispname),9,pe),e("table",fe,[e("thead",null,[e("tr",null,[(s(!0),r(d,null,h(t.columns,(_,v)=>(s(),r("th",{scope:"col",key:v},a(_),1))),128))])]),e("tbody",null,[(s(!0),r(d,null,h(t.results,(_,v)=>(s(),r("tr",{key:v},[y(u,{totLaps:t.laps,Pos:v,data:_},null,8,["totLaps","Pos","data"])]))),128))])]),e("a",{role:"button",onClick:l[0]||(l[0]=_=>n.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(s(),r("div",ve,ge))]))}var $e=g(ee,[["render",ke]]);const be={props:["data","Pos"],data(){return{count:0}},computed:{}};function Ce(i,l,c,p,o,n){return s(),r(d,null,[e("td",null,a(c.Pos+1),1),e("td",null,a(c.data.Bib),1),e("td",null,a(c.data.Name),1),e("td",null,a(c.data.Age),1),e("td",null,a(c.data.Sponsor),1),(s(!0),r(d,null,h(c.data.results,(u,t)=>(s(),r("td",{class:b({"text-danger":u.dropped}),key:t},a(u.resultString),3))),128)),e("td",null,a(c.data.seriesPoints),1)],64)}var Re=g(be,[["render",Ce]]);const xe={components:{SeriesResultRow:Re},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(i){var l=document.querySelector(`#${i}`);l.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let i=`/api/series/results/${this.$route.params.seriesid}`;fetch(i).then(l=>l.json()).then(l=>{this.loading=!1,this.categories=l.categories}).catch(l=>{console.error(l),this.categories={},this.error=l.toString()})}},computed:{sortedCats(){let i;return this.$route.path.indexOf("grom")>-1?i=f.filter(this.categories,l=>l.id.indexOf("grom")>-1):i=f.filter(this.categories,l=>l.id.indexOf("grom")==-1),f.orderBy(i,"disporder")},expertCats(){return f.filter(this.sortedCats,{laps:4})},sportCats(){return f.filter(this.sortedCats,{laps:3})},beginnerCats(){return f.filter(this.sortedCats,{laps:2})},gromCats(){return this.$route.path.indexOf("grom")>-1?f.filter(this.categories,i=>i.id.indexOf("grom")>-1):[]},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},Se={key:0,class:"loading"},we={key:1},Te={key:0,class:"error"},Ne=e("div",{class:"container-fluid text-center mt-5"},[e("h2",null,"2022 Prairie City Race Series"),e("h3",null,"Series Standings"),e("p",null,[$("Glossary of terms below:"),e("br"),$(" 1/50 = 1st Place/50 Points -/- = Did not race")])],-1),Me={key:1},Pe={class:"container-fluid text-center mt-5"},Le={class:"list-inline"},Oe=["onClick"],De={class:"list-inline"},Be=["onClick"],Ve={class:"list-inline"},je=["onClick"],Ue={class:"list-inline"},Ae=["onClick"],He={class:"container-fluid"},qe=["id"],Ie={class:"table table-striped table-hover"},Fe={key:2},Ee=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),Ge=[Ee];function We(i,l,c,p,o,n){const u=k("SeriesResultRow");return o.loading?(s(),r("div",Se,"Loading...")):(s(),r("div",we,[o.error?(s(),r("div",Te,a(o.error),1)):C("",!0),Ne,n.haveResults?(s(),r("div",Me,[e("div",Pe,[e("ul",Le,[(s(!0),r(d,null,h(n.expertCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,Oe)]))),128))]),e("ul",De,[(s(!0),r(d,null,h(n.sportCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,Be)]))),128))]),e("ul",Ve,[(s(!0),r(d,null,h(n.beginnerCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,je)]))),128))]),e("ul",Ue,[(s(!0),r(d,null,h(n.gromCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:_=>n.scrollMeTo(t.id),class:"link-primary"},a(t.catdispname),9,Ae)]))),128))])]),e("div",He,[(s(!0),r(d,null,h(n.sortedCats,(t,m)=>(s(),r("div",{key:t.id,class:"mt-5"},[e("h3",{id:t.id},a(t.catdispname),9,qe),e("table",Ie,[e("thead",null,[e("tr",null,[(s(!0),r(d,null,h(t.columns,(_,v)=>(s(),r("th",{scope:"col",key:v},a(_),1))),128))])]),e("tbody",null,[(s(!0),r(d,null,h(t.results,(_,v)=>(s(),r("tr",{key:v},[y(u,{Pos:v,data:_},null,8,["Pos","data"])]))),128))])]),e("a",{role:"button",onClick:l[0]||(l[0]=_=>n.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(s(),r("div",Fe,Ge))]))}var x=g(xe,[["render",We]]);const ze={props:["data","Pos"],data(){return{count:0,dates:["5/4","5/11","5/18","5/25"]}},computed:{}};function Ke(i,l,c,p,o,n){return s(),r(d,null,[e("td",null,a(c.data.Name),1),e("td",null,a(c.data.Cat),1),(s(!0),r(d,null,h(o.dates,(u,t)=>(s(),r("td",{key:t},a(c.data[u]),1))),128))],64)}var Je=g(ze,[["render",Ke]]);const Qe={components:{ResultRow:Je},data(){return{teamResults:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(i){var l=document.querySelector(`#${i}`);l.scrollIntoView({behavior:"smooth"})},fetchData(){if(this.error=null,this.loading=!0,this.$route.params.seriesid){let i=`/api/team-comp?series=${this.$route.params.seriesid}`;fetch(i).then(l=>l.json()).then(l=>{this.loading=!1,this.teamResults=l}).catch(l=>{console.error(l),this.teamResults={},this.error=l.toString()})}}},computed:{dates:()=>{}}},Xe={key:0,class:"loading"},Ye={key:1},Ze={key:0,class:"error"},et=e("h2",{class:"mt-5"},"Team Standings",-1),tt={class:"container-fluid mt-5"},st={class:"table table-striped table-hover"},rt=e("thead",null,[e("tr",null,[e("th",null,"Position"),e("th",null,"Team"),e("th",null,"Total Points")])],-1),lt=e("h2",{class:"mt-5"},"Team Results",-1),nt={class:"container-fluid"},it={class:"table table-striped table-hover"},at=e("thead",null,[e("tr",null,[e("th",{style:{width:"25%"}},"Racer Name"),e("th",{style:{width:"25%"}},"Class"),e("th",null,"5/4"),e("th",null,"5/11"),e("th",null,"5/18"),e("th",null,"5/25")])],-1),ot={class:"table table-striped table-hover"},ct=e("th",{style:{width:"50%","text-align":"right"}},"Score (Avg of individual results):",-1);function dt(i,l,c,p,o,n){const u=k("ResultRow");return o.loading?(s(),r("div",Xe,"Loading...")):(s(),r("div",Ye,[o.error?(s(),r("div",Ze,a(o.error),1)):C("",!0),et,e("div",tt,[e("table",st,[rt,e("tbody",null,[(s(!0),r(d,null,h(o.teamResults.result,(t,m)=>(s(),r("tr",{key:m},[e("td",null,a(m+1),1),e("td",null,a(t.teamName),1),e("td",null,a(t.totalPoints),1)]))),128))])])]),lt,(s(!0),r(d,null,h(o.teamResults.result,(t,m)=>(s(),r("div",{class:"mt-5",key:m},[e("h3",null,a(t.teamName),1),e("div",nt,[e("table",it,[at,e("tbody",null,[(s(!0),r(d,null,h(o.teamResults.teamDets[t.teamName],(_,v)=>(s(),r("tr",{key:v},[y(u,{data:_},null,8,["data"])]))),128))])]),e("table",ot,[e("thead",null,[e("tr",null,[ct,e("th",null,a(t.results["5/4"].avg),1),e("th",null,a(t.results["5/11"]?t.results["5/11"].avg:""),1),e("th",null,a(t.results["5/18"]?t.results["5/18"].avg:""),1),e("th",null,a(t.results["5/25"]?t.results["5/25"].avg:""),1)])])])])]))),128))]))}var ut=g(Qe,[["render",dt]]);const ht=N({history:M("/"),routes:[{path:"/race/:raceid",component:$e},{path:"/series/:seriesid",component:x},{path:"/series/grom/:seriesid",component:x},{path:"/teamcomp/:seriesid",component:ut}]});const S=P(J);S.use(ht);S.mount("#app");