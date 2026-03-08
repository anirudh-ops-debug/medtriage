
-- Delete patient "Jaya" and related records
DELETE FROM patient_timeline WHERE patient_id = (SELECT id FROM patients WHERE name = 'Jaya');
DELETE FROM vitals WHERE patient_id = (SELECT id FROM patients WHERE name = 'Jaya');
DELETE FROM triage WHERE patient_id = (SELECT id FROM patients WHERE name = 'Jaya');
DELETE FROM patient_reports WHERE patient_id = (SELECT id FROM patients WHERE name = 'Jaya');
DELETE FROM patients WHERE name = 'Jaya';

-- Update symptoms and medical history for all CSV patients
UPDATE triage SET symptoms = ARRAY['chest pain', 'shortness of breath', 'dizziness', 'loss of consciousness'], medical_history = ARRAY['history of heart disease', 'hypertension'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-001');
UPDATE triage SET symptoms = ARRAY['cough', 'fever', 'chest pain', 'difficulty breathing'], medical_history = ARRAY['smoking history', 'recent respiratory infection'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-002');
UPDATE triage SET symptoms = ARRAY['frequent urination', 'increased thirst', 'fatigue', 'blurred vision'], medical_history = ARRAY['long-term diabetes', 'family history'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-003');
UPDATE triage SET symptoms = ARRAY['headache', 'dizziness', 'blurred vision'], medical_history = ARRAY['chronic high blood pressure'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-004');
UPDATE triage SET symptoms = ARRAY['wheezing', 'shortness of breath', 'chest tightness', 'coughing'], medical_history = ARRAY['allergy history', 'previous asthma attacks'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-005');
UPDATE triage SET symptoms = ARRAY['sudden weakness', 'slurred speech', 'confusion', 'headache'], medical_history = ARRAY['hypertension', 'diabetes', 'smoking'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-006');
UPDATE triage SET symptoms = ARRAY['severe headache', 'nausea', 'sensitivity to light'], medical_history = ARRAY['recurring headaches', 'light sensitivity'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-007');
UPDATE triage SET symptoms = ARRAY['swelling in legs', 'fatigue', 'nausea', 'reduced urine output'], medical_history = ARRAY['chronic kidney disease', 'diabetes'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-008');
UPDATE triage SET symptoms = ARRAY['fever', 'cough', 'loss of smell', 'fatigue'], medical_history = ARRAY['recent viral exposure'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-009');
UPDATE triage SET symptoms = ARRAY['severe pain', 'swelling', 'inability to move limb'], medical_history = ARRAY['recent injury or fall'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-010');
UPDATE triage SET symptoms = ARRAY['frequent urination', 'increased thirst', 'fatigue', 'blurred vision'], medical_history = ARRAY['long-term diabetes', 'family history'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-011');
UPDATE triage SET symptoms = ARRAY['chest pain', 'shortness of breath', 'dizziness', 'loss of consciousness'], medical_history = ARRAY['history of heart disease', 'hypertension'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-012');
UPDATE triage SET symptoms = ARRAY['wheezing', 'shortness of breath', 'chest tightness', 'coughing'], medical_history = ARRAY['allergy history', 'previous asthma attacks'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-013');
UPDATE triage SET symptoms = ARRAY['headache', 'dizziness', 'blurred vision'], medical_history = ARRAY['chronic high blood pressure'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-014');
UPDATE triage SET symptoms = ARRAY['cough', 'fever', 'chest pain', 'difficulty breathing'], medical_history = ARRAY['smoking history', 'recent respiratory infection'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-015');
UPDATE triage SET symptoms = ARRAY['sudden weakness', 'slurred speech', 'confusion', 'headache'], medical_history = ARRAY['hypertension', 'diabetes', 'smoking'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-016');
UPDATE triage SET symptoms = ARRAY['severe headache', 'nausea', 'sensitivity to light'], medical_history = ARRAY['recurring headaches', 'light sensitivity'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-017');
UPDATE triage SET symptoms = ARRAY['swelling in legs', 'fatigue', 'nausea', 'reduced urine output'], medical_history = ARRAY['chronic kidney disease', 'diabetes'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-018');
UPDATE triage SET symptoms = ARRAY['wheezing', 'shortness of breath', 'chest tightness', 'coughing'], medical_history = ARRAY['allergy history', 'previous asthma attacks'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-019');
UPDATE triage SET symptoms = ARRAY['chest pain', 'shortness of breath', 'dizziness', 'loss of consciousness'], medical_history = ARRAY['history of heart disease', 'hypertension'] WHERE patient_id = (SELECT id FROM patients WHERE patient_code = 'PT-020');
