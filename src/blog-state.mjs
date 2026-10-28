export const PAGE_SIZE=5;
export const VISITED_KEY='nikmorozovs:blog:visited:v1';
export const compareIds=(a,b)=>a<b?-1:a>b?1:0;
export function validISO(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'0001-01-01')return false;
 const d=new Date(value+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===value;
}
export function parseDate(value){if(!value.trim())return '';if(!/^\d{2}\/\d{2}\/\d{4}$/.test(value))throw Error('Use DD/MM/YYYY.');const [d,m,y]=value.split('/'),iso=`${y}-${m}-${d}`;if(!validISO(iso))throw Error('Enter a valid calendar date.');return iso;}
export const displayDate=iso=>iso?iso.split('-').reverse().join('/'):'';
export const defaultState=()=>({tags:[],from:'',to:'',sort:'new'});
export function tagCounts(posts){const counts=new Map();for(const p of posts)for(const t of new Set(p.tags))counts.set(t,(counts.get(t)||0)+1);return [...counts].sort((a,b)=>b[1]-a[1]||compareIds(a[0],b[0]));}
export function normalizeState(value,tags){const s=defaultState();s.tags=[...new Set(Array.isArray(value.tags)?value.tags.filter(t=>tags.includes(t)):[])].sort(compareIds);s.from=validISO(value.from)?value.from:'';s.to=validISO(value.to)?value.to:'';if(s.from&&s.to&&s.from>s.to)s.from=s.to='';s.sort=value.sort==='old'?'old':'new';return s;}
export function readQuery(query,tags){const p=new URLSearchParams(query);return normalizeState({tags:p.getAll('tag'),from:p.get('from'),to:p.get('to'),sort:p.get('sort')},tags);}
export function writeQuery(s){const p=new URLSearchParams();for(const tag of s.tags)p.append('tag',tag);for(const key of ['from','to'])if(s[key])p.set(key,s[key]);if(s.sort==='old')p.set('sort','old');return p.toString();}
export const activeFilters=s=>s.tags.length+Number(!!s.from)+Number(!!s.to);
export function selectPosts(posts,state,config={}){const filtered=posts.filter(p=>(!state.tags.length||p.tags.some(t=>state.tags.includes(t)))&&(!state.from||p.date>=state.from)&&(!state.to||p.date<=state.to)).sort((a,b)=>(state.sort==='old'?compareIds(a.date,b.date):compareIds(b.date,a.date))||compareIds(a.id,b.id));const visible=Math.max(PAGE_SIZE,Number.isSafeInteger(config.visible)?config.visible:PAGE_SIZE);return {filtered,posts:filtered.slice(0,visible),hasMore:filtered.length>visible};}

export function rememberAndRecommend(posts,current,storage){let visited=[];try{const value=JSON.parse(storage?.getItem(VISITED_KEY)||'[]');if(Array.isArray(value))visited=value.filter(v=>typeof v==='string');}catch{}visited=[...new Set([...visited,current])].filter(id=>posts.some(p=>p.id===id));try{storage?.setItem(VISITED_KEY,JSON.stringify(visited));}catch{}return posts.find(p=>p.id!==current&&!visited.includes(p.id))||null;}
