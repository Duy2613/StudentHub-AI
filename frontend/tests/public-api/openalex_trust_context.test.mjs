import test from 'node:test';
import assert from 'node:assert/strict';
import { OpenAlexTrustContextService } from '../../src/lib/server/public-api/OpenAlexTrustContextService.js';
import { publicSourceHub } from '../../src/lib/server/public-api/PublicSourceHub.js';
test('claimless scholarly DOI invokes exact academic discovery without manufacturing evidence', async () => {
  const original = publicSourceHub.openAlex;
  const calls = [];
  publicSourceHub.openAlex = { apiKey:'fixture', searchWorks:async params => {
    calls.push(params);
    return {ok:true,records:[{sourceId:'openalex:fixture',title:'Deep learning',url:'https://doi.org/10.1038/nature14539',metadata:{doi:'10.1038/nature14539'}}]};
  } };
  try {
    const result = await OpenAlexTrustContextService.discover({claims:[],input:{type:'text',content:'Scholarly paper DOI 10.1038/nature14539.'}});
    assert.equal(calls.length,1);
    assert.equal(calls[0].doi,'10.1038/nature14539');
    assert.equal(result.queryCount,1);
    assert.equal(result.works.length,1);
    assert.equal(result.allowedUse,'CONTEXT_ONLY');
    assert.equal(result.isAuthoritative,false);
    assert.equal(result.evidence,undefined);
    const unrelated = await OpenAlexTrustContextService.discover({claims:[],input:{content:'Hello world'}});
    assert.equal(unrelated.status,'NOT_REQUESTED');
    assert.equal(calls.length,1);
  } finally { publicSourceHub.openAlex=original; }
});
