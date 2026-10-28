import {createHash} from 'node:crypto';
export const DEFAULT_CATEGORY='Business Analysis & Decision Making';
export function parseSkills(csv,now=new Date()){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<csv.length;i++){const c=csv[i];if(c==='"'){if(quoted&&csv[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));if(row.some(Boolean))rows.push(row);row=[];cell='';}else cell+=c;}
 if(quoted)throw Error('Unclosed CSV quote');if(cell||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}const header=rows.shift().map(x=>x.replace(/^\uFEFF/,''));const fields=['category','skill','experience_years','start_date','priority'];if(fields.some(k=>!header.includes(k)))throw Error('Missing skills fields');
 const ids=new Set(),priorities={'высокий':'High','средний':'Medium','низкий':'Low'},month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
 return rows.map(r=>{if(r.length!==header.length)throw Error('Invalid CSV row');const s=Object.fromEntries(header.map((k,i)=>[k,r[i].trim()]));if(!s.category||!s.skill||!priorities[s.priority]||!/^\d{4}-(0[1-9]|1[0-2])$/.test(s.start_date)||s.start_date<'1900-01'||s.start_date>month||!Number.isFinite(Number(s.experience_years))||Number(s.experience_years)<0)throw Error('Invalid skill: '+s.skill);const id=createHash('sha256').update(s.category+'\0'+s.skill).digest('hex').slice(0,16);if(ids.has(id))throw Error('Duplicate skill: '+s.skill);ids.add(id);return {...s,id,priority:priorities[s.priority],experience_years:Number(s.experience_years)};});
}
