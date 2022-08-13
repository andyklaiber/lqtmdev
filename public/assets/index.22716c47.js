import{r as g,o as s,c as r,a as e,F as d,b as _,d as y,n as $,w as R,e as w,f as b,t as o,R as L,g as C,_ as p,h as M,i as N,j as P}from"./vendor.9e377b4a.js";const T=function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))f(l);new MutationObserver(l=>{for(const i of l)if(i.type==="childList")for(const u of i.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&f(u)}).observe(document,{childList:!0,subtree:!0});function c(l){const i={};return l.integrity&&(i.integrity=l.integrity),l.referrerpolicy&&(i.referrerPolicy=l.referrerpolicy),l.crossorigin==="use-credentials"?i.credentials="include":l.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function f(l){if(l.ep)return;l.ep=!0;const i=c(l);fetch(l.href,i)}};T();var k=(a,n)=>{const c=a.__vccOpts||a;for(const[f,l]of n)c[f]=l;return c};const O={props:["races"],data(){return{count:0}},computed:{}},B=w('<nav id="top" class="navbar navbar-light bg-light"><div class="container-fluid"><div class="navbar-brand" href="#">2022 Prairie City Race Series</div><div class="nav-item"><a class="nav-link active" aria-current="page" href="https://racemtb.com/">RaceMtb Home</a></div></div></nav><p class="mt-3">View Weekly lap times:</p>',2),V={class:"nav nav-tabs mt-1 justify-content-center"},D={class:"nav-item"},j=b("Series Standings"),A={class:"nav-item"},q=b("Grom Series Standings");function F(a,n,c,f,l,i){const u=g("RouterLink");return s(),r(d,null,[B,e("ul",V,[(s(!0),r(d,null,_(c.races,t=>(s(),r("li",{key:t.raceid,class:"nav-item"},[y(u,{class:$(["nav-link",{active:a.$route.params.raceid===t.raceid}]),to:`/race/${t.raceid}`},{default:R(()=>[b(o(t.displayName+` - ${t.formattedStartDate}`),1)]),_:2},1032,["class","to"])]))),128)),e("li",D,[y(u,{class:$(["nav-link",{active:a.$route.path=="/series/pcrs_2022"}]),to:"/series/pcrs_2022"},{default:R(()=>[j]),_:1},8,["class"])]),e("li",A,[y(u,{class:$(["nav-link",{active:a.$route.path=="/series/grom/pcrs_2022"}]),to:"/series/grom/pcrs_2022"},{default:R(()=>[q]),_:1},8,["class"])])])],64)}var H=k(O,[["render",F]]);let I="/api/races/";const U={components:{RouterView:L,NavBar:H},data(){return{races:[]}},mounted:function(){fetch(I).then(a=>a.json()).then(a=>{this.races=a,window.location.hash.indexOf("race/")==-1&&this.$router.push("/series/pcrs_2022"),console.log("route:"),console.log(this.$route)})},computed:{raceMeta(){return this.races.find(a=>a.raceid===this.$route.params.raceid)}}},E={key:0,class:"text-center"},G={class:"mt-5"};function W(a,n,c,f,l,i){var m;const u=g("NavBar"),t=g("RouterView");return s(),r(d,null,[y(u,{races:l.races},null,8,["races"]),i.raceMeta?(s(),r("div",E,[e("h2",G,"Race Results - "+o((m=i.raceMeta)==null?void 0:m.formattedStartDate),1)])):C("",!0),y(t)],64)}var z=k(U,[["render",W]]);const K={props:["data","Pos","totLaps"],data(){return{count:0}},computed:{incompleteLaps(){return new Array(this.totLaps-this.data.laps.length).fill("-")}}};function J(a,n,c,f,l,i){return s(),r(d,null,[e("td",null,o(c.Pos+1),1),e("td",null,o(c.data.Bib),1),e("td",null,o(c.data.Name),1),e("td",null,o(c.data.Sponsor),1),(s(!0),r(d,null,_(c.data.laps,(u,t)=>(s(),r("td",{key:t},o(u.timeString),1))),128)),c.totLaps-c.data.laps.length>0?(s(!0),r(d,{key:0},_(i.incompleteLaps,u=>(s(),r("td",null,o(u),1))),256)):C("",!0),e("td",null,o(c.data.Time),1),e("td",null,o(c.data.back||"-"),1)],64)}var Q=k(K,[["render",J]]);const X={components:{ResultRow:Q},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(a){var n=document.querySelector(`#${a}`);n.scrollIntoView({behavior:"smooth"})},fetchData(){if(this.error=null,this.loading=!0,this.$route.params.raceid){let a=`/api/races/results/${this.$route.params.raceid}`;fetch(a).then(n=>n.json()).then(n=>{this.loading=!1,this.categories=n.categories}).catch(n=>{console.error(n),this.categories={},this.error=n.toString()})}}},computed:{sortedCats(){return p.orderBy(this.categories,"disporder")},expertCats(){return p.filter(this.sortedCats,{laps:4})},sportCats(){return p.filter(this.sortedCats,{laps:3})},beginnerCats(){return p.filter(this.sortedCats,{laps:2})},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},Y={key:0,class:"loading"},Z={key:1},ee={key:0,class:"error"},te={key:1},se={class:"container text-center mt-5"},re={class:"list-inline"},ie=["onClick"],ne={class:"list-inline"},ae=["onClick"],le={class:"list-inline"},oe=["onClick"],ce={class:"container-fluid"},de=["id"],ue={class:"table table-striped table-hover"},_e={key:2},he=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),me=[he];function pe(a,n,c,f,l,i){const u=g("ResultRow");return l.loading?(s(),r("div",Y,"Loading...")):(s(),r("div",Z,[l.error?(s(),r("div",ee,o(l.error),1)):C("",!0),i.haveResults?(s(),r("div",te,[e("div",se,[e("ul",re,[(s(!0),r(d,null,_(i.expertCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,ie)]))),128))]),e("ul",ne,[(s(!0),r(d,null,_(i.sportCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,ae)]))),128))]),e("ul",le,[(s(!0),r(d,null,_(i.beginnerCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,oe)]))),128))])]),e("div",ce,[(s(!0),r(d,null,_(i.sortedCats,(t,m)=>(s(),r("div",{key:t.id,class:"mt-5"},[e("h3",{id:t.id},o(t.catdispname),9,de),e("table",ue,[e("thead",null,[e("tr",null,[(s(!0),r(d,null,_(t.columns,(h,v)=>(s(),r("th",{scope:"col",key:v},o(h),1))),128))])]),e("tbody",null,[(s(!0),r(d,null,_(t.results,(h,v)=>(s(),r("tr",{key:v},[y(u,{totLaps:t.laps,Pos:v,data:h},null,8,["totLaps","Pos","data"])]))),128))])]),e("a",{role:"button",onClick:n[0]||(n[0]=h=>i.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(s(),r("div",_e,me))]))}var fe=k(X,[["render",pe]]);const ve={props:["data","Pos"],data(){return{count:0}},computed:{}};function ye(a,n,c,f,l,i){return s(),r(d,null,[e("td",null,o(c.Pos+1),1),e("td",null,o(c.data.Bib),1),e("td",null,o(c.data.Name),1),e("td",null,o(c.data.Age),1),e("td",null,o(c.data.Sponsor),1),(s(!0),r(d,null,_(c.data.results,(u,t)=>(s(),r("td",{key:t},o(u.resultString),1))),128)),e("td",null,o(c.data.seriesPoints),1)],64)}var ke=k(ve,[["render",ye]]);const ge={components:{SeriesResultRow:ke},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(a){var n=document.querySelector(`#${a}`);n.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let a=`/api/series/results/${this.$route.params.seriesid}`;fetch(a).then(n=>n.json()).then(n=>{this.loading=!1,this.categories=n.categories}).catch(n=>{console.error(n),this.categories={},this.error=n.toString()})}},computed:{sortedCats(){let a;return this.$route.path.indexOf("grom")>-1?a=p.filter(this.categories,n=>n.id.indexOf("grom")>-1):a=p.filter(this.categories,n=>n.id.indexOf("grom")==-1),p.orderBy(a,"disporder")},expertCats(){return p.filter(this.sortedCats,{laps:4})},sportCats(){return p.filter(this.sortedCats,{laps:3})},beginnerCats(){return p.filter(this.sortedCats,{laps:2})},gromCats(){return this.$route.path.indexOf("grom")>-1?p.filter(this.categories,a=>a.id.indexOf("grom")>-1):[]},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},be={key:0,class:"loading"},Ce={key:1},$e={key:0,class:"error"},Re=e("div",{class:"container-fluid text-center mt-5"},[e("h2",null,"2022 Prairie City Race Series"),e("h3",null,"Series Standings"),e("p",null,[b("Glossary of terms below:"),e("br"),b(" 1/50 = 1st Place/50 Points -/- = Did not race")])],-1),xe={key:1},Se={class:"container-fluid text-center mt-5"},we={class:"list-inline"},Le=["onClick"],Me={class:"list-inline"},Ne=["onClick"],Pe={class:"list-inline"},Te=["onClick"],Oe={class:"list-inline"},Be=["onClick"],Ve={class:"container-fluid"},De=["id"],je={class:"table table-striped table-hover"},Ae={key:2},qe=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),Fe=[qe];function He(a,n,c,f,l,i){const u=g("SeriesResultRow");return l.loading?(s(),r("div",be,"Loading...")):(s(),r("div",Ce,[l.error?(s(),r("div",$e,o(l.error),1)):C("",!0),Re,i.haveResults?(s(),r("div",xe,[e("div",Se,[e("ul",we,[(s(!0),r(d,null,_(i.expertCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,Le)]))),128))]),e("ul",Me,[(s(!0),r(d,null,_(i.sportCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,Ne)]))),128))]),e("ul",Pe,[(s(!0),r(d,null,_(i.beginnerCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,Te)]))),128))]),e("ul",Oe,[(s(!0),r(d,null,_(i.gromCats,(t,m)=>(s(),r("li",{key:t.id,class:"list-inline-item mx-2"},[e("a",{role:"button",onClick:h=>i.scrollMeTo(t.id),class:"link-primary"},o(t.catdispname),9,Be)]))),128))])]),e("div",Ve,[(s(!0),r(d,null,_(i.sortedCats,(t,m)=>(s(),r("div",{key:t.id,class:"mt-5"},[e("h3",{id:t.id},o(t.catdispname),9,De),e("table",je,[e("thead",null,[e("tr",null,[(s(!0),r(d,null,_(t.columns,(h,v)=>(s(),r("th",{scope:"col",key:v},o(h),1))),128))])]),e("tbody",null,[(s(!0),r(d,null,_(t.results,(h,v)=>(s(),r("tr",{key:v},[y(u,{Pos:v,data:h},null,8,["Pos","data"])]))),128))])]),e("a",{role:"button",onClick:n[0]||(n[0]=h=>i.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(s(),r("div",Ae,Fe))]))}var x=k(ge,[["render",He]]);const Ie=M({history:N("/"),routes:[{path:"/race/:raceid",component:fe},{path:"/series/:seriesid",component:x},{path:"/series/grom/:seriesid",component:x}]});const S=P(z);S.use(Ie);S.mount("#app");