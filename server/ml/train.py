"""Train AdaBoost and GradientBoosting models on the symptom dataset."""
import pandas as pd
import joblib
import json
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import AdaBoostClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# load dataset
data = pd.read_csv('ml/dataset.csv')
# fill missing values with zeros
if data.isna().any().any():
    data = data.fillna(0)

# drop rows without a valid disease label
invalid = data['disease'].isnull() | (data['disease'] == '') | data['disease'].astype(str).str.match(r'^\d+$')
if invalid.any():
    print(f"Dropping {invalid.sum()} rows with invalid disease labels")
    data = data[~invalid]
    # save cleaned dataset
    data.to_csv('ml/dataset.csv', index=False)

# warn if dataset has no variance
if data.drop('disease', axis=1).nunique().max() <= 1:
    print("WARNING: all symptom columns are constant. Run rebuild_dataset or populate dataset with varied samples.")

# features and label
X = data.drop('disease', axis=1)
feature_columns = list(X.columns)
le = LabelEncoder()
y = le.fit_transform(data['disease'])

# split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

models = {
    'adaboost': AdaBoostClassifier(n_estimators=50, random_state=42),
    'gbm': GradientBoostingClassifier(n_estimators=100, random_state=42)
}

results = {}

for name, model in models.items():
    try:
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        acc = accuracy_score(y_test, preds)
        results[name] = acc
        print(f"{name} accuracy: {acc:.2f}")
        joblib.dump(model, f'ml/models/{name}.pkl')
    except Exception as e:
        print(f"Failed to train {name}: {e}")
        results[name] = 0

# save label encoder and feature list
joblib.dump(le, 'ml/models/label_encoder.pkl')
with open('ml/models/feature_columns.json', 'w') as f:
    json.dump(feature_columns, f)

# export metrics for API use
data_metrics = {
    'accuracy': results,
    'classes': le.classes_.tolist()
}
with open('ml/models/metrics.json', 'w') as f:
    json.dump(data_metrics, f)

print("Training complete. Models saved to ml/models/")
print("Detailed classification reports:")
for name, model in models.items():
    preds = model.predict(X_test)
    print(f"--- {name} ---")
    # only include labels present in test set to avoid mismatch
    import numpy as np
    present = np.unique(y_test)
    print(classification_report(y_test, preds, labels=present,
                                target_names=le.classes_[present]))
