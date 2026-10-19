export const cases = [
  {
    slug:'chat-platform', short:'Chat platform', window:'Chat', icon:'chat', number:'01',
    title:'A chat platform built around regional access.',
    category:'Solution evaluation · Release planning',
    summary:'Comparing chat platforms, selecting Chatwoot and planning a self-hosted regional pilot.',
    scope:'Regional pilot', scopeLabel:'Delivery stage',
    contribution:'Comparison, requirements, stakeholder alignment and release planning.',
    sections:[
      ['Context & constraints','Regional availability was a key constraint in the choice of a chat platform. The work considered alternative solutions and the option of self-hosting.'],
      ['My role','My contribution covered comparing options, defining requirements, aligning the choice with stakeholders and preparing the release plan.'],
      ['Analysis & decisions','The comparison led to the selection of Chatwoot. Self-hosting was chosen to address regional availability.'],
      ['Implementation','The agreed direction was translated into a release plan and a regional pilot. The pilot is the confirmed delivery stage; it is not presented as a complete rollout.'],
      ['Confirmed outcome','Chatwoot was selected and taken into a self-hosted regional pilot. Financial savings and full-rollout outcomes are outside the confirmed scope.']
    ],
    flow:['Regional constraints','Compare options','Align on Chatwoot','Regional pilot']
  },
  {
    slug:'quality-assessment', short:'Quality assessment', window:'Quality', icon:'quality', number:'02',
    title:'A common framework for assessing quality.',
    category:'Process design · Google Sheets',
    summary:'A Google Sheets assessment system with weighted criteria, shared rules and privacy for bonus information.',
    scope:'2 departments', scopeLabel:'More than 30 people in scope',
    contribution:'Weighted criteria and rules, result comparison, privacy and synchronisation.',
    sections:[
      ['Context & constraints','The quality assessment system covers two departments and more than 30 people in total. Bonus-related information needed to remain private.'],
      ['My role','My work brought together assessment criteria, their weights and the rules used to interpret results. Comparison and synchronisation were part of the system.'],
      ['Analysis & decisions','The system uses weighted criteria rather than an unqualified total. Rules support comparison of results, while access to bonus information remains separate.'],
      ['Implementation','Google Sheets was used for the assessment system, including result comparison and synchronisation. No internal spreadsheets or employee records are published here.'],
      ['Confirmed outcome','The assessment system spans two departments and more than 30 people. These figures describe coverage; they do not represent a measured improvement in efficiency.']
    ],
    flow:['Weighted criteria','Assessment rules','Private bonus data','Compare & sync']
  },
  {
    slug:'data-exchange', short:'Data exchange', window:'Data', icon:'data', number:'03',
    title:'Finding the sequence behind a data defect.',
    category:'Process analysis · Defect investigation',
    summary:'Comparing successful and failed records to identify a process-sequence error and give developers a clear finding.',
    scope:'Process sequence', scopeLabel:'Root cause identified',
    contribution:'Record comparison, process analysis and findings for developers.',
    sections:[
      ['Context & constraints','Some records passed through the data exchange process successfully while others failed. The defect also created a need for manual corrections.'],
      ['My role','I compared successful and unsuccessful records and investigated the sequence of the process. I then provided the findings to developers.'],
      ['Analysis & decisions','The comparison revealed an error in the order of process operations. This connected the failed records to a specific process-sequence issue.'],
      ['Implementation','Developers changed the process using the analytical findings. The analysis and the implementation are distinct contributions.'],
      ['Confirmed outcome','The developers’ process change eliminated the defect and its associated manual corrections. No financial or percentage improvement is claimed.']
    ],
    flow:['Compare records','Trace the sequence','Share the finding','Developers fix process']
  },
  {
    slug:'internal-tool', short:'Internal tool', window:'Tool', icon:'tool', number:'04',
    title:'Payment presets, easier to find and keep current.',
    category:'Internal systems · Operational tooling',
    summary:'An internal tool combining search, favourite payment presets and automated updates.',
    scope:'80+ colleagues', scopeLabel:'Customer-facing employees with access',
    contribution:'Search, favourites and automation of preset updates.',
    sections:[
      ['Context & constraints','The internal tool makes payment presets available to customer-facing teams. Access extends to more than 80 customer-facing employees.'],
      ['My role','Work on the tool brought together searching for presets, keeping favourites and automating updates.'],
      ['Analysis & decisions','Search and favourites provide two ways to retrieve presets. Automated updates support keeping the information current.'],
      ['Implementation','The resulting internal tool includes preset search, favourites and automated updates. Teams and management use it in their daily work.'],
      ['Confirmed outcome','The tool is used daily by teams and management, with access available to 80+ customer-facing employees. This is not a count of 80+ daily active users, and no measured time saving for every employee is claimed.']
    ],
    flow:['Payment presets','Search & favourites','Automated updates','Daily team use']
  }
];

export function icon(name) {
  const paths={
    chat:'<path d="M8 8h32a5 5 0 0 1 5 5v20a5 5 0 0 1-5 5H23L12 46v-8H8a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z"/><path d="M13 19h22M13 27h15"/>',
    quality:'<rect x="7" y="6" width="34" height="40" rx="5"/><path d="m15 18 3 3 6-7M28 18h7m-20 14 3 3 6-7M28 32h7"/>',
    data:'<rect x="2" y="7" width="15" height="13" rx="3"/><rect x="31" y="29" width="15" height="13" rx="3"/><path d="M17 13h15a7 7 0 0 1 7 7v4m-4-4 4 4 4-4M31 36H16a7 7 0 0 1-7-7v-4m-4 4 4-4 4 4"/>',
    tool:'<circle cx="20" cy="20" r="12"/><path d="m29 29 12 12M14 20h12m-6-6v12"/>'
  };
  return `<svg viewBox="0 0 48 52" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
