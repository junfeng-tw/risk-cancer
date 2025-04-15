import pandas as pd
import numpy as np
import os
import joblib
import warnings
import m2cgen as m2c

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, recall_score, make_scorer
from sklearn.ensemble import (
    RandomForestClassifier, GradientBoostingClassifier, ExtraTreesClassifier,
    AdaBoostClassifier, BaggingClassifier, HistGradientBoostingClassifier
)
from sklearn.linear_model import (
    LogisticRegression, RidgeClassifier, SGDClassifier,
    PassiveAggressiveClassifier, Perceptron
)
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB, BernoulliNB, MultinomialNB
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier

from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType
import onnxruntime as rt



warnings.filterwarnings('ignore')

def load_and_preprocess_data(train_path, test_path, features, random_state=5):
    train_df = pd.read_csv(train_path)
    test_df = pd.read_csv(test_path)

    X_train = train_df[features]
    y_train = train_df["Group"].map({1: 0, 2: 1})

    X_test = test_df[features]
    y_test = test_df["Group"].map({1: 0, 2: 1})

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train_scaled, X_test_scaled, y_train, y_test

def get_models_and_params():
    return {
        "ExtraTrees": {
            "model": ExtraTreesClassifier(random_state=42),
            "params": {"n_estimators": [100], "max_depth": [None, 10]}
        },
        "RandomForest": {
            "model": RandomForestClassifier(random_state=42),
            "params": {"n_estimators": [100], "max_depth": [None, 10]}
        },
        "GradientBoosting": {
            "model": GradientBoostingClassifier(random_state=42),
            "params": {"n_estimators": [100], "learning_rate": [0.1]}
        },
        "XGBoost": {
            "model": XGBClassifier(random_state=42),
            "params": {"n_estimators": [100], "max_depth": [3], "learning_rate": [0.1]}
        },
        "LightGBM": {
            "model": LGBMClassifier(random_state=42),
            "params": {"n_estimators": [100], "learning_rate": [0.1]}
        },
        "LogisticRegression": {
            "model": LogisticRegression(random_state=42, solver="liblinear"),
            "params": {"C": [1.0], "penalty": ["l2"]}
        },
        "SVM": {
            "model": SVC(random_state=42, probability=True),
            "params": {"C": [1.0], "kernel": ["rbf"]}
        },
        "AdaBoost": {
            "model": AdaBoostClassifier(random_state=42),
            "params": {"n_estimators": [50]}
        },
        "Bagging": {
            "model": BaggingClassifier(random_state=42),
            "params": {"n_estimators": [10]}
        },
        "HistGradientBoosting": {
            "model": HistGradientBoostingClassifier(random_state=42),
            "params": {"max_iter": [100]}
        },
        "GaussianNB": {
            "model": GaussianNB(),
            "params": {}
        },
        "BernoulliNB": {
            "model": BernoulliNB(),
            "params": {"alpha": [1.0]}
        },
        "MultinomialNB": {
            "model": MultinomialNB(),
            "params": {"alpha": [1.0]}
        },
        "KNN": {
            "model": KNeighborsClassifier(),
            "params": {"n_neighbors": [5]}
        },
        "MLP": {
            "model": MLPClassifier(random_state=42, max_iter=500),
            "params": {"hidden_layer_sizes": [(100,)]}
        },
        "DecisionTree": {
            "model": DecisionTreeClassifier(random_state=42),
            "params": {"max_depth": [10]}
        },
        "QDA": {
            "model": QuadraticDiscriminantAnalysis(),
            "params": {}
        }
    }

def main():
    features = ["var1", "var3", "var4", "var39", "var42"]
    X_train_scaled, X_test_scaled, y_train, y_test = load_and_preprocess_data(
        "python-train-model/data/Train_expr.csv", "python-train-model/data/Test_expr.csv", features
    )

    models = get_models_and_params()
    results = []
    scoring = {
        'auc': make_scorer(roc_auc_score, needs_proba=True),
        'recall': make_scorer(recall_score)
    }

    output_dir = "python-train-model/saved_models"
    os.makedirs(output_dir, exist_ok=True)

    for name, model_info in models.items():
        print(f"\n=== Training {name} ===")
        try:
            grid_search = GridSearchCV(
                estimator=model_info["model"],
                param_grid=model_info["params"],
                scoring=scoring,
                refit='auc',
                cv=5,
                n_jobs=-1,
                verbose=0
            )
            grid_search.fit(X_train_scaled, y_train)

            y_pred = grid_search.predict(X_test_scaled)
            y_prob = grid_search.predict_proba(X_test_scaled)[:, 1] if hasattr(grid_search, 'predict_proba') else None

            auc_score = roc_auc_score(y_test, y_prob) if y_prob is not None else np.nan
            recall = recall_score(y_test, y_pred)

            # 保存模型
            model_path = os.path.join(output_dir, f"{name}.pkl")
            joblib.dump(grid_search.best_estimator_, model_path)

            # 尝试导出为 JavaScript
            try:
                js_code = m2c.export_to_javascript(grid_search.best_estimator_)
                with open(os.path.join(output_dir, f"{name}.js"), "w") as js_file:
                    js_file.write(js_code)
            except Exception as e:
                print(f"Could not export {name} to JavaScript: {e}")

            try:
                initial_type = [('float_input', FloatTensorType([None, X_train_scaled.shape[1]]))]
                onnx_model = convert_sklearn(grid_search.best_estimator_, initial_types=initial_type, options={
                    'zipmap': False
                })
                onnx_path = os.path.join(output_dir, f"{name}.onnx")
                with open(onnx_path, "wb") as f:
                    f.write(onnx_model.SerializeToString())

                # 载入 ONNX 并进行推理
                sess = rt.InferenceSession(onnx_path)
                input_name = sess.get_inputs()[0].name
                label_name = sess.get_outputs()[1].name
                onnx_pred_prob = sess.run([label_name], {input_name: X_test_scaled.astype(np.float32)})[0]

                if onnx_pred_prob.shape[1] == 2:  # 二分类，取正类概率
                    onnx_probs = onnx_pred_prob[:, 1]
                else:  # 有些模型只有一个输出
                    onnx_probs = onnx_pred_prob.ravel()

                onnx_pred_labels = (onnx_probs >= 0.5).astype(int)
                onnx_auc = roc_auc_score(y_test, onnx_probs)
                onnx_recall = recall_score(y_test, onnx_pred_labels)

                print(f"ONNX AUC Score for {name}: {onnx_auc:.4f}")
                print(f"ONNX Recall Score for {name}: {onnx_recall:.4f}")

            except Exception as e:
                print(f"Could not export or evaluate {name} ONNX: {e}")


            results.append({
                'Model': name,
                'Best Parameters': grid_search.best_params_,
                'AUC Score': auc_score,
                'Recall Score': recall
            })
        except Exception as e:
            print(f"{name} failed: {str(e)}")

    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('AUC Score', ascending=False)

    print("\n=== Final Results ===")
    print(results_df[['Model', 'AUC Score', 'Recall Score']])

    if not results_df.empty:
        best_model_name = results_df.iloc[0]['Model']
        print(f"\nBest Model: {best_model_name}")
        print(f"Best AUC Score: {results_df.iloc[0]['AUC Score']:.4f}")
        print(f"Best Recall Score: {results_df.iloc[0]['Recall Score']:.4f}")

if __name__ == "__main__":
    main()
