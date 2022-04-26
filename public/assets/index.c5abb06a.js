import{r as y,o as t,c as s,a as e,F as u,b as h,d as f,n as R,w as S,e as L,f as k,t as c,R as x,g as b,_ as $,h as N,i as P,j as B}from"./vendor.9e377b4a.js";const M=function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))m(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const d of i.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&m(d)}).observe(document,{childList:!0,subtree:!0});function l(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerpolicy&&(i.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?i.credentials="include":n.crossorigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function m(n){if(n.ep)return;n.ep=!0;const i=l(n);fetch(n.href,i)}};M();var g=(o,r)=>{const l=o.__vccOpts||o;for(const[m,n]of r)l[m]=n;return l};const O={props:["races"],data(){return{count:0}},computed:{}},V=L('<nav id="top" class="navbar navbar-expand-sm navbar-light bg-light"><div class="container-fluid"><div class="navbar-brand" href="#">2022 Prairie City Race Series</div><div class="nav-item"><a class="nav-link active" aria-current="page" href="https://racemtb.com/">RaceMtb Home</a></div></div></nav><p class="mt-3">View Weekly lap times:</p>',2),T={class:"nav nav-tabs mt-1"},D={class:"nav-item"},j=k("Series Standings"),A={class:"nav-item"},q=k("Grom Series Standings");function F(o,r,l,m,n,i){const d=y("RouterLink");return t(),s(u,null,[V,e("ul",T,[(t(!0),s(u,null,h(l.races,a=>(t(),s("li",{key:a.raceid,class:"nav-item"},[f(d,{class:R(["nav-link",{active:o.$route.params.raceid===a.raceid}]),to:`/race/${a.raceid}`},{default:S(()=>[k(c(a.displayName+` - ${a.formattedStartDate}`),1)]),_:2},1032,["class","to"])]))),128)),e("li",D,[f(d,{class:R(["nav-link",{active:o.$route.path=="/series/pcrs_2022"}]),to:"/series/pcrs_2022"},{default:S(()=>[j]),_:1},8,["class"])]),e("li",A,[f(d,{class:R(["nav-link",{active:o.$route.path=="/series/grom/pcrs_2022"}]),to:"/series/grom/pcrs_2022"},{default:S(()=>[q]),_:1},8,["class"])])])],64)}var H=g(O,[["render",F]]);let I="/api/races/";const U={components:{RouterView:x,NavBar:H},data(){return{races:[]}},mounted:function(){fetch(I).then(o=>o.json()).then(o=>{this.races=o,window.location.hash.indexOf("race/")==-1&&this.$router.push("/series/pcrs_2022"),console.log("route:"),console.log(this.$route)})},computed:{raceMeta(){return this.races.find(o=>o.raceid===this.$route.params.raceid)}}},E={key:0,class:"text-center"},G={class:"mt-5"};function W(o,r,l,m,n,i){var v;const d=y("NavBar"),a=y("RouterView");return t(),s(u,null,[f(d,{races:n.races},null,8,["races"]),i.raceMeta?(t(),s("div",E,[e("h2",G,"Race Results - "+c((v=i.raceMeta)==null?void 0:v.formattedStartDate),1)])):b("",!0),f(a)],64)}var z=g(U,[["render",W]]);const K={props:["data","Pos","totLaps"],data(){return{count:0}},computed:{incompleteLaps(){return new Array(this.totLaps-this.data.laps.length).fill("-")}}};function J(o,r,l,m,n,i){return t(),s(u,null,[e("td",null,c(l.Pos+1),1),e("td",null,c(l.data.Bib),1),e("td",null,c(l.data.Name),1),e("td",null,c(l.data.Sponsor),1),(t(!0),s(u,null,h(l.data.laps,(d,a)=>(t(),s("td",{key:a},c(d.timeString),1))),128)),l.totLaps-l.data.laps.length>0?(t(!0),s(u,{key:0},h(i.incompleteLaps,d=>(t(),s("td",null,c(d),1))),256)):b("",!0),e("td",null,c(l.data.Time),1),e("td",null,c(l.data.back||"-"),1)],64)}var Q=g(K,[["render",J]]);const X={components:{ResultRow:Q},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(o){var r=document.querySelector(`#${o}`);r.scrollIntoView({behavior:"smooth"})},fetchData(){if(this.error=null,this.loading=!0,this.$route.params.raceid){let o=`/api/races/results/${this.$route.params.raceid}`;fetch(o).then(r=>r.json()).then(r=>{this.loading=!1,this.categories=r.categories}).catch(r=>{console.error(r),this.categories={},this.error=r.toString()})}}},computed:{sortedCats(){return $.orderBy(this.categories,"disporder")},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},Y={key:0,class:"loading"},Z={key:1},ee={key:0,class:"error"},te={key:1},se={class:"container text-center mt-5"},re={class:"list-inline"},ae=["onClick"],oe={class:"container-fluid"},ne=["id"],ie={class:"table table-striped table-hover"},le={key:2},ce=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),de=[ce];function ue(o,r,l,m,n,i){const d=y("ResultRow");return n.loading?(t(),s("div",Y,"Loading...")):(t(),s("div",Z,[n.error?(t(),s("div",ee,c(n.error),1)):b("",!0),i.haveResults?(t(),s("div",te,[e("div",se,[e("ul",re,[(t(!0),s(u,null,h(i.sortedCats,(a,v)=>(t(),s("li",{key:a.id,class:"list-inline-item"},[e("a",{role:"button",onClick:_=>i.scrollMeTo(a.id),class:"link-primary"},c(a.catdispname),9,ae)]))),128))])]),e("div",oe,[(t(!0),s(u,null,h(i.sortedCats,(a,v)=>(t(),s("div",{key:a.id,class:"mt-5"},[e("h3",{id:a.id},c(a.catdispname),9,ne),e("table",ie,[e("thead",null,[e("tr",null,[(t(!0),s(u,null,h(a.columns,(_,p)=>(t(),s("th",{scope:"col",key:p},c(_),1))),128))])]),e("tbody",null,[(t(!0),s(u,null,h(a.results,(_,p)=>(t(),s("tr",{key:p},[f(d,{totLaps:a.laps,Pos:p,data:_},null,8,["totLaps","Pos","data"])]))),128))])]),e("a",{role:"button",onClick:r[0]||(r[0]=_=>i.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(t(),s("div",le,de))]))}var he=g(X,[["render",ue]]);const _e={props:["data","Pos"],data(){return{count:0}},computed:{}};function me(o,r,l,m,n,i){return t(),s(u,null,[e("td",null,c(l.Pos+1),1),e("td",null,c(l.data.Bib),1),e("td",null,c(l.data.Name),1),e("td",null,c(l.data.Age),1),e("td",null,c(l.data.Sponsor),1),(t(!0),s(u,null,h(l.data.results,(d,a)=>(t(),s("td",{key:a},c(d.resultString),1))),128)),e("td",null,c(l.data.seriesPoints),1)],64)}var pe=g(_e,[["render",me]]);const fe={components:{SeriesResultRow:pe},data(){return{categories:{},loading:!1,error:null}},created(){this.$watch(()=>this.$route.params,()=>{this.fetchData()},{immediate:!0})},methods:{scrollMeTo(o){var r=document.querySelector(`#${o}`);r.scrollIntoView({behavior:"smooth"})},fetchData(){this.error=null,this.loading=!0;let o=`/api/series/results/${this.$route.params.seriesid}`;fetch(o).then(r=>r.json()).then(r=>{this.loading=!1,this.categories=r.categories}).catch(r=>{console.error(r),this.categories={},this.error=r.toString()})}},computed:{sortedCats(){let o;return this.$route.path.indexOf("grom")>-1?o=$.filter(this.categories,r=>r.id.indexOf("grom")>-1):o=$.filter(this.categories,r=>r.id.indexOf("grom")==-1),$.orderBy(o,"disporder")},haveResults(){return this.categories?Object.keys(this.categories).length>0:!1}}},ve={key:0,class:"loading"},ge={key:1},ye={key:0,class:"error"},ke=e("div",{class:"container text-center mt-5"},[e("h2",null,"2022 Prairie City Race Series"),e("h3",null,"Series Standings"),e("p",null,[k("Glossary of terms below:"),e("br"),k(" 1/50 = 1st Place/50 Points -/- = Did not race")])],-1),$e={key:1},be={class:"container text-center mt-5"},Re={class:"list-inline"},Se=["onClick"],we={class:"container-fluid"},Ce=["id"],Le={class:"table table-striped table-hover"},xe={key:2},Ne=e("div",{class:"text-center"},[e("h2",{class:"mt-5"},"No results yet...")],-1),Pe=[Ne];function Be(o,r,l,m,n,i){const d=y("SeriesResultRow");return n.loading?(t(),s("div",ve,"Loading...")):(t(),s("div",ge,[n.error?(t(),s("div",ye,c(n.error),1)):b("",!0),ke,i.haveResults?(t(),s("div",$e,[e("div",be,[e("ul",Re,[(t(!0),s(u,null,h(i.sortedCats,(a,v)=>(t(),s("li",{key:a.id,class:"list-inline-item"},[e("a",{role:"button",onClick:_=>i.scrollMeTo(a.id),class:"link-primary"},c(a.catdispname),9,Se)]))),128))])]),e("div",we,[(t(!0),s(u,null,h(i.sortedCats,(a,v)=>(t(),s("div",{key:a.id,class:"mt-5"},[e("h3",{id:a.id},c(a.catdispname),9,Ce),e("table",Le,[e("thead",null,[e("tr",null,[(t(!0),s(u,null,h(a.columns,(_,p)=>(t(),s("th",{scope:"col",key:p},c(_),1))),128))])]),e("tbody",null,[(t(!0),s(u,null,h(a.results,(_,p)=>(t(),s("tr",{key:p},[f(d,{Pos:p,data:_},null,8,["Pos","data"])]))),128))])]),e("a",{role:"button",onClick:r[0]||(r[0]=_=>i.scrollMeTo("top")),class:"link-primary"},"Back to Top")]))),128))])])):(t(),s("div",xe,Pe))]))}var w=g(fe,[["render",Be]]);const Me=N({history:P("/"),routes:[{path:"/race/:raceid",component:he},{path:"/series/:seriesid",component:w},{path:"/series/grom/:seriesid",component:w}]});const C=B(z);C.use(Me);C.mount("#app");
