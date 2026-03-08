"""Load trained models and make a prediction from command-line symptoms."""
import sys
import json
import pandas as pd
import joblib

if len(sys.argv) < 2:
    print(json.dumps({'error': 'Please provide symptoms as JSON array'}))
    sys.exit(1)


# raw input may contain numbers (1-520) referring to a master symptom list
symptoms = json.loads(sys.argv[1])

# load numeric->symptom mapping if available, convert any numeric entries
index_path = 'ml/symptom_list.txt'
index_map = {}
try:
    with open(index_path, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                key = parts[0]
                # the symptom name may contain underscores already
                value = '_'.join(parts[1:])
                index_map[key] = value
except Exception:
    # missing mapping is not fatal; we'll just skip number conversion
    index_map = {}

# normalize symptoms list: convert numbers to names using index_map
converted = []
for s in symptoms:
    if isinstance(s, (int, float)) or (isinstance(s, str) and s.isdigit()):
        name = index_map.get(str(int(s)))
        if name:
            converted.append(name)
        else:
            # keep numeric entry if mapping not available
            converted.append(str(s))
    else:
        converted.append(s)
symptoms = converted


# load feature columns and metrics
with open('ml/models/feature_columns.json') as f:
    cols = json.load(f)
with open('ml/models/metrics.json') as f:
    metrics = json.load(f)

# convert symptoms list to feature vector
features = [1 if c in symptoms else 0 for c in cols]

# compute how many of the selected symptoms appear in each disease from the dataset
match_counts = None
try:
    df = pd.read_csv('ml/dataset.csv')
    disease_map = {}
    for _, row in df.iterrows():
        disease = row.get('disease')
        if not isinstance(disease, str) or disease == '':
            continue
        # gather symptoms where column value indicates presence
        syms = [col for col in cols if row.get(col) in (1, '1', True, 'True')]
        disease_map[disease] = set(syms)
    matches = []
    symptoms_set = set(symptoms)
    for dis, syms in disease_map.items():
        matches.append({'disease': dis, 'match_count': len(syms & symptoms_set)})
    matches.sort(key=lambda x: x['match_count'], reverse=True)
    match_counts = matches
except Exception:
    match_counts = None

# load models and encoder
adaboost = joblib.load('ml/models/adaboost.pkl')
gbm = joblib.load('ml/models/gbm.pkl')
le = joblib.load('ml/models/label_encoder.pkl')

# make predictions
import numpy as np
arr = np.array(features).reshape(1, -1)
pred1 = adaboost.predict(arr)[0]
pred2 = gbm.predict(arr)[0]

# compute probabilities for each class and average
try:
    proba1 = adaboost.predict_proba(arr)[0]
    proba2 = gbm.predict_proba(arr)[0]
    avg_proba = (proba1 + proba2) / 2.0
except Exception:
    avg_proba = None

# decode predicted labels

disease1 = le.inverse_transform([pred1])[0]
disease2 = le.inverse_transform([pred2])[0]

# if encoder produced a numeric or unexpected value, try using metrics classes
if isinstance(disease1, (int, float)) or disease1 == '0':
    disease1 = metrics.get('classes', [])[pred1] if pred1 < len(metrics.get('classes', [])) else str(disease1)
if isinstance(disease2, (int, float)) or disease2 == '0':
    disease2 = metrics.get('classes', [])[pred2] if pred2 < len(metrics.get('classes', [])) else str(disease2)

# USE GBM AS PRIMARY (98.75% accuracy) instead of weak AdaBoost (31% accuracy)
primary_disease = disease2  # GBM prediction
secondary_disease = disease1  # AdaBoost prediction

# simplistic risk and recommendations
# simple risk mapping based on predicted disease
# you can extend or modify these entries to include new diseases
# or adjust risk levels (Low, Medium, High, Critical)
risk_map = {
    'Common Cold': 'Low',
    'Allergy': 'Low',
    'Flu': 'Medium',
    'Migraine': 'Medium',
    'Strep Throat': 'Medium',
    'Asthma': 'Medium',
    'Hypertension': 'Medium',
    'Typhoid': 'High',
    'COVID-19': 'High',
    'Dengue fever': 'High',
    'Malaria': 'High',
    'Tuberculosis': 'High',
    'Diabetes': 'High',
    'Pneumonia': 'High',
    'Severe Infection': 'High',
    'Heart Attack': 'Critical',
    'Stroke': 'Critical'
}
# recommendation text based on risk level; change as needed
rec_map = {
    'Low': 'Rest and stay hydrated. Monitor symptoms.',
    'Medium': 'Consult a healthcare professional if symptoms worsen.',
    'High': 'Seek medical attention immediately.',
    'Critical': 'CALL EMERGENCY SERVICES (911/999) IMMEDIATELY!'
}

# per-disease treatment suggestions
# add or customize entries to give more specific advice
treatment_map = {
    'Common Cold': 'Rest, fluids, over-the-counter cold remedies, steam inhalation.',
    'Allergy': 'Avoid allergens, antihistamines, topical steroid creams.',
    'Flu': 'Antiviral medication (within 48h), rest, hydration, fever management.',
    'Migraine': 'Pain relievers, rest in dark room, prescribed preventive medication.',
    'Strep Throat': 'Antibiotics prescribed by doctor, throat lozenges, warm liquids.',
    'Asthma': 'Rescue inhaler (albuterol), controller medications, avoid triggers.',
    'Hypertension': 'Lifestyle changes, reduce salt, exercise regularly, prescribed medications.',
    'Typhoid': 'Antibiotics (chloramphenicol/fluoroquinolones), supportive care, hydration.',
    'COVID-19': 'Isolation, supportive care, oxygen if needed, antiviral treatment.',
    'Dengue fever': 'Supportive care, platelet transfusion if needed, manage pain.',
    'Malaria': 'Antimalarial drugs (artemisinin-based), fever management.',
    'Tuberculosis': 'Prolonged antibiotic therapy (6+ months), directly observed therapy.',
    'Diabetes': 'Insulin/oral meds, diet management, regular exercise, monitoring.',
    'Pneumonia': 'Antibiotics or antivirals, oxygen therapy, supportive care.',
    'Severe Infection': 'Urgent hospital care, IV antibiotics, possible ICU admission.',
    'Heart Attack': 'EMERGENCY: Aspirin, oxygen, angioplasty/thrombolysis, ICU care.',
    'Stroke': 'EMERGENCY: CT/MRI scan, thrombolysis within 24h, ICU monitoring.'
}

risk1 = risk_map.get(primary_disease, 'Medium')
rec1 = rec_map[risk1]

# treatment based on disease
treat1 = treatment_map.get(primary_disease, 'Consult a healthcare professional for appropriate treatment.')

# simple next steps suggestions per disease
# used to provide actionable advice in the UI
next_steps_map = {
    'Common Cold': ['Rest and hydrate', 'Use saline nasal drops', 'Honey for cough relief'],
    'Allergy': ['Identify triggers', 'Use antihistamines', 'Avoid allergen sources'],
    'Flu': ['Antiviral medication within 48h', 'Stay isolated and rest', 'Seek medical care if worsening'],
    'Migraine': ['Pain relievers', 'Dark quiet room', 'Preventive medication consult'],
    'Strep Throat': ['Consult doctor for antibiotics', 'Take full course', 'Rest throat'],
    'Asthma': ['Use rescue inhaler', 'Avoid triggers', 'Pulmonologist visit recommended'],
    'Hypertension': ['Reduce salt intake', 'Cardio exercise 30min/day', 'Monitor BP regularly'],
    'Typhoid': ['Start antibiotics immediately', 'Complete 7-14 day course', 'Maintain nutrition'],
    'COVID-19': ['Isolate for 5-10 days', 'Monitor O2 levels', 'Seek urgent care if breathing difficulty'],
    'Dengue fever': ['Hospital admission', 'Daily blood tests', 'Watch for warning signs'],
    'Malaria': ['Antimalarial treatment', 'Complete full course', 'Follow up after treatment'],
    'Tuberculosis': ['TB specialist visit', 'Stick to 6-month treatment', 'TB-contact screening'],
    'Diabetes': ['Consult endocrinologist', 'Get blood sugar test', 'Start lifestyle modification'],
    'Pneumonia': ['Seek medical attention', 'Chest X-ray', 'Follow antibiotic/antiviral treatment'],
    'Severe Infection': ['Visit hospital immediately', 'Follow emergency protocol', 'Blood cultures needed'],
    'Heart Attack': ['CALL 911/EMERGENCY NOW', 'Chew aspirin if available', 'CPR if unconscious'],
    'Stroke': ['CALL 911/EMERGENCY NOW', 'Note time of symptom start', 'Do not eat/drink']
}
next_steps = next_steps_map.get(primary_disease, ['Follow up with healthcare professional'])

# build probability distribution list if we computed it
prob_list = None
if avg_proba is not None:
    try:
        classes = []
        # decode probability class labels in same order as label encoder
        for i in range(len(avg_proba)):
            try:
                classes.append(le.inverse_transform([i])[0])
            except Exception:
                classes.append(metrics.get('classes', [])[i] if i < len(metrics.get('classes', [])) else str(i))
        paired = list(zip(classes, avg_proba.tolist()))
        # sort descending and take top 5
        paired.sort(key=lambda x: x[1], reverse=True)
        prob_list = [{'disease': p[0], 'probability': p[1]} for p in paired]
    except Exception:
        prob_list = None

# assemble output - PRIMARY IS GBM (98.75% accuracy) instead of weak AdaBoost (31%)
output = {
    'symptoms': symptoms,
    'prediction_adaboost': disease1,
    'prediction_gbm': primary_disease,
    'prediction': primary_disease,  # Main prediction uses GBM (high accuracy)
    'accuracy_adaboost': metrics['accuracy'].get('adaboost', 0),
    'accuracy_gbm': metrics['accuracy'].get('gbm', 0),
    'accuracy': metrics['accuracy'].get('gbm', 0),  # Use GBM accuracy for display
    'risk_level': risk1,
    'recommendation': rec1,
    'treatment': treat1,
    'next_steps': next_steps,
    'probability_distribution': prob_list,
    'match_counts': match_counts
}

print(json.dumps(output))
