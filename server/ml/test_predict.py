import json
import joblib
import numpy as np

# sample symptoms to test
symptoms = ["fever", "cough"]

# also try numeric codes (if mapping file exists)
idx_map = {}
try:
    with open('ml/symptom_list.txt') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 2:
                idx_map[parts[0]] = '_'.join(parts[1:])
    # append a couple of codes to symptom list
    symptoms.append(idx_map.get('1', 'fever'))
    symptoms.append(idx_map.get('121', 'cough'))
except Exception:
    pass

# load metadata and models
with open('ml/models/feature_columns.json') as f:
    cols = json.load(f)
adaboost = joblib.load('ml/models/adaboost.pkl')
gbm = joblib.load('ml/models/gbm.pkl')
le = joblib.load('ml/models/label_encoder.pkl')

# build feature vector
features = [1 if c in symptoms else 0 for c in cols]
arr = np.array(features).reshape(1, -1)

print('AdaBoost:', le.inverse_transform([adaboost.predict(arr)[0]])[0])
print('GBM    :', le.inverse_transform([gbm.predict(arr)[0]])[0])
