window.RECEIPT_SAMPLE = {
  version:1, title:'Plan a neighborhood café event', demo:true,
  payment:{mode:'subscription',fixed_monthly_usd:20,additional_paid_usd:0},
  requests:[
    {id:'r1',text:'Find three examples of neighborhood café events and propose an event plan.'},
    {id:'r2',text:'Revise the plan to fit a $100 budget and shorten the invitation.'}
  ],
  events:[
    {id:'e1',request_id:'r1',kind:'model',activity:'Search',label:'Prepare search queries',attribution:'trace',model:'Example model',usage:{input_tokens:1800,cached_input_tokens:0,output_tokens:240},rates:{input_per_million:2,cached_per_million:0.5,output_per_million:8}},
    {id:'e2',request_id:'r1',kind:'tool',activity:'Search',label:'Web search — 3 calls',attribution:'trace',provider_cost_usd:0.03},
    {id:'e3',request_id:'r1',kind:'model',activity:'Summarize',label:'Read and summarize search results',attribution:'trace',model:'Example model',usage:{input_tokens:9200,cached_input_tokens:1200,output_tokens:600},rates:{input_per_million:2,cached_per_million:0.5,output_per_million:8}},
    {id:'e4',request_id:'r1',kind:'model',activity:'Generate',label:'Write event plan and invitation',attribution:'manual',model:'Example model',usage:{input_tokens:6800,cached_input_tokens:1800,output_tokens:1400},rates:{input_per_million:2,cached_per_million:0.5,output_per_million:8}},
    {id:'e5',request_id:'r2',kind:'model',activity:'Revise',label:'Revise budget and invitation',attribution:'manual',model:'Example model',usage:{input_tokens:7400,cached_input_tokens:5400,output_tokens:700},rates:{input_per_million:2,cached_per_million:0.5,output_per_million:8}}
  ]
};
