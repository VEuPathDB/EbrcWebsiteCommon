
-- GUS 4 migration script validation SQL
--   If migration script is successful, all counts below should be zero

-- 1. No steps with these questions have GeneRecordClass in display_params
select 'Number with GeneRecordClass in display_params' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and question_name in (
    'GeneQuestions.GenesBySimilarity',
    'GenomicSequenceQuestions.SequencesBySimilarity',
    'InternalQuestions.GeneRecordClasses_GeneRecordClassBySnapshotBasket',
    'InternalQuestions.boolean_question_GeneRecordClasses_GeneRecordClass',
    'GeneQuestions.GeneBySingleLocusTag',
    'InternalQuestions.TranscriptRecordClasses_TranscriptRecordClassBySnapshotBasket',
    'InternalQuestions.boolean_question_TranscriptRecordClasses_TranscriptRecordClass' )
  and display_params like '%GeneRecordClass%'
;

-- 2. No steps with these questions have IsolateRecordClass in display_params
select 'Number with IsolateRecordClass in display_params' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and question_name in (
    'IsolateQuestions.IsolatesBySimilarity',
    'InternalQuestions.IsolateRecordClasses_IsolateRecordClassBySnapshotBasket',
    'InternalQuestions.boolean_question_IsolateRecordClasses_IsolateRecordClass',
    'InternalQuestions.PopsetRecordClasses_PopsetRecordClassBySnapshotBasket',
    'InternalQuestions.boolean_question_PopsetRecordClasses_PopsetRecordClass' )
  and display_params like '%IsolateRecordClass%'
;

-- 3. These question names should be purged
select 'Number with old internal questions' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and question_name in (
    'InternalQuestions.boolean_question_GeneRecordClasses_GeneRecordClass',
    'InternalQuestions.GeneRecordClasses_GeneRecordClassBySnapshotBasket',
    'InternalQuestions.boolean_question_IsolateRecordClasses_IsolateRecordClass',
    'InternalQuestions.IsolateRecordClasses_IsolateRecordClassBySnapshotBasket' )
;

-- 4. Question names in question mapping file should be purged
select 'Number with old questions from mapping file' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and question_name in (
'InternalQuestions.boolean_question_GeneRecordClasses_GeneRecordClass',
'InternalQuestions.GeneRecordClasses_GeneRecordClassBySnapshotBasket',
'InternalQuestions.boolean_question_IsolateRecordClasses_IsolateRecordClass',
'InternalQuestions.IsolateRecordClasses_IsolateRecordClassBySnapshotBasket',
'IsolateQuestions.IsolateByCountry',
'IsolateQuestions.IsolatesByTextSearch',
'IsolateQuestions.IsolateByHost',
'IsolateQuestions.IsolateByStudy',
'IsolateQuestions.IsolatesBySimilarity',
'IsolateQuestions.IsolateByIsolateId',
'IsolateQuestions.IsolateByIsolationSource',
'IsolateQuestions.IsolateByProduct',
'IsolateQuestions.IsolateByTaxon',
'IsolateQuestions.IsolateByRFLPGenotype',
'IsolateQuestions.IsolateByGenotypeNumber',
'GeneQuestions.GenesByHighTroughputPhenotyping',
'GeneQuestions.GenesByExpressionTiming',
'GeneQuestions.GenesByMicroarrayPercentileDerisi',
'GeneQuestions.GenesByRNASeqPfRBCFoldChange',
'GeneQuestions.GenesByKappePercentile',
'GeneQuestions.GenesByKappeFoldChange',
'GeneQuestions.GenesByExtraerythrocyticExpression',
'GeneQuestions.GenesByGametocyteExpression',
'GeneQuestions.GenesByRNASeqPfRBCExprnPercentile',
'GeneQuestions.BergheiGenesByExpressionPercentile',
'GeneQuestions.GenesByIntraerythrocyticExpression',
'GeneQuestions.GenesByIntraerythroExprFoldChange',
'GeneQuestions.GenesByGametocyteExprFoldChange',
'GeneQuestions.GenesByChIPchipPlasmo',
'GeneQuestions.GenesByMetabolicPathwayKegg',
'GeneQuestions.GenesByVivaxExpressionTiming',
'GeneQuestions.GenesByExtraerythroExprFoldChange',
'GeneQuestions.GenesByPvivTimingPercentile',
'GeneQuestions.GenesByWatersDifferentialExpression',
'GeneQuestions.GenesByCowmanSir2Percentile',
'GeneQuestions.GenesByExpressionPercentileA',
'GeneQuestions.GenesByDifferentialMeanExpression',
'GeneQuestions.GenesByCortesTranscriptVariantome3D7',
'GeneQuestions.GenesByWatersPercentile',
'GeneQuestions.GenesBySuCqFoldChange',
'GeneQuestions.GenesByCowmanSir2FoldChange',
'GeneQuestions.GenesByCortesTranscriptVariantomeD10',
'GeneQuestions.BergheiGenesByExpressionFoldChange',
'GeneQuestions.GenesByRNASeqCimmRS_Taylor_SaprobicParasitic_rnaSeq_RSRC',
'GeneQuestions.GenesByRNASeqCalbSC5314_Snyder_ComprehensiveAnnotation_rnaSeq_RSRC',
'GeneQuestions.GenesByRNASeqCposC735deltSOWgp_Taylor_SaprobicParasitic_rnaSeq_RSRC',
'GeneQuestions.GenesByToxoFoldChangeBoothroyd',
'GeneQuestions.GenesByChIPchipToxo',
'GeneQuestions.GenesByExpressionPercentileBoothroyd',
'GeneQuestions.ToxoGenesBySibleyRNASeqBradyzoitePct',
'GeneQuestions.ToxoGenesByBoothroydRNASeqOocystPct',
'GeneQuestions.GenesByTimeSeriesFoldChangeBradyBoothroyd',
'GeneQuestions.GenesBySpliceSitestbruTREU927_Nilsson_Spliced_Leader_rnaSeqSplicedLeaderAndPolyASites_RSRC' )
;

-- 5. All display_params should have params, filters, viewFilters
select 'Number without params or without filters or without viewFilters' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and (display_params not like '%"params":%'
   or display_params not like '%"filters":%'
   or display_params not like '%"viewFilters":%')
;

-- 6. use_boolean_filter should not appear in display_params
select 'Number with use_boolean_filter param' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and display_params like '%use_boolean_filter%'
;

-- 7. (maybe?) All transcript question steps should have display_params with
--    either "matched_transcript_filter_array" or "gene_boolean_filter_array"
select 'Number of tx steps without one of the always-on filters' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and is_valid != 0 -- ignore old, invalid questions
  and question_name like '%GeneQuestions%'
  and question_name != 'GeneQuestions.GenesByTaxonGene' -- actually a Gene question (not transcript)
  and display_params not like '%matched_transcript_filter_array%'
  and display_params not like '%gene_boolean_filter_array%'
;

-- 8. Remove "matched_transcript_filter_array" from non-transcript steps
select 'Number of non-tx steps with matched tx filter' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and question_name not like '%GeneQuestions%'
  and question_name != 'UniversalQuestions.UnifiedBlast' -- can be a transcript question too
  -- strange case- exploring...
  --and question_name != 'GenesBySpliceSitestbruTREU927_Nilsson_Spliced_Leader_rnaSeqSplicedLeaderAndPolyASites_RSRC'
  and display_params like '%matched_transcript_filter_array%'
;

-- 9. Look for bad orgs in display_params

/* comment for now; this test should be done after the org mapping migration step

select 'Number with old orgs from mapping file' as test_name from dual
;
select count(*) from userlogins5.steps st, userlogins5.users u
  where st.user_id = u.user_id and u.is_guest = 0 and is_deleted != 1
  and (
    display_params like '%Phytophthora cinnamomi var. cinnamomi%'
    or display_params like '%Phytophthora ramorum%'
    or display_params like '%Phytophthora sojae%'
    or display_params like '%Ajellomyces capsulatus G186AR%'
    or display_params like '%Ajellomyces capsulatus NAm1%'
    or display_params like '%Botryotinia fuckeliana B05.10%'
    or display_params like '%Neosartorya fischeri NRRL 181%'
    or display_params like '%Cryptococcus gattii R265%'
    or display_params like '%Vavraia culicis floridensis%'
    or display_params like '%Sarcocystis neurona SN1%'
    or display_params like '%Trypanosoma brucei TREU927%'
    or display_params like '%Ajellomyces capsulatus%'
    or display_params like '%Botryotinia fuckeliana%'
    or display_params like '%Neosartorya fischeri%'
    or display_params like '%Cryptococcus gattii%' )
;
*/
