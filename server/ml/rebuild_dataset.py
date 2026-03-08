import pandas as pd
import random

# define header
cols=['fever','cough','headache','sore_throat','shortness_of_breath',
      'chest_pain','fatigue','high_blood_sugar','frequent_urination','chills',
      'unexplained_weight_loss','excessive_sweating','phlegm_production',
      'known_high_bp','heart_palpitations','swollen_ankles_feet','seizures',
      'dizziness','confusion_memory_loss','numbness_tingling','increased_thirst',
      'increased_hunger','slow_wound_healing','painful_urination','blood_in_urine',
      'nausea','vomiting','diarrhea','constipation','abdominal_pain','joint_pain',
      'morning_stiffness','muscle_aches','back_pain','skin_rash','yellowing_skin',
      'itching','skin_lesions','blurred_vision','runny_nose','hearing_loss','ear_pain',
      'anxiety','mood_swings','depressed_mood','insomnia']

# diseases to include

diseases=["Common Cold","Flu","Pneumonia","Migraine","Strep Throat","Severe Infection","Allergy","Diabetes"]

# typical symptom associations
patterns = {
    "Common Cold": ['fever','cough','runny_nose','sore_throat'],
    "Flu": ['fever','cough','chills','headache','fatigue'],
    "Pneumonia": ['fever','cough','shortness_of_breath','chest_pain','fatigue'],
    "Migraine": ['headache','nausea','vomiting'],
    "Strep Throat": ['sore_throat','fever','headache'],
    "Severe Infection": ['fever','chills','confusion_memory_loss','fatigue'],
    "Allergy": ['runny_nose','itching','skin_rash'],
    "Diabetes": ['high_blood_sugar','frequent_urination','increased_thirst','fatigue']
}

rows=[]
for d in diseases:
    for i in range(50):
        sample=[0]*len(cols)
        for sym in patterns.get(d, []):
            if sym in cols:
                sample[cols.index(sym)] = 1
        # add 1-3 random noisy symptoms
        for _ in range(random.randint(1,3)):
            idx = random.randrange(len(cols))
            sample[idx] = random.choice([0,1])
        rows.append(sample+[d])

# write file
import os
outpath = r'd:\multi-disease\server\ml\dataset.csv'
df = pd.DataFrame(rows, columns=cols+['disease'])
df.to_csv(outpath, index=False)
print('rebuilt dataset.csv with', df.shape)

