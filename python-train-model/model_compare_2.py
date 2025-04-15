import pandas as pd
import numpy as np
import os
import joblib
import warnings
import m2cgen as m2c
import matplotlib.pyplot as plt

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

    # 打印均值和标准差
    means = scaler.mean_.tolist()
    stds = scaler.scale_.tolist()
    print("Means:", means)
    print("Stds:", stds)

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

            # 计算训练集预测及指标
            y_train_pred = grid_search.predict(X_train_scaled)
            if hasattr(grid_search.best_estimator_, 'predict_proba'):
                y_train_prob = grid_search.predict_proba(X_train_scaled)[:, 1]
                train_auc = roc_auc_score(y_train, y_train_prob)
            else:
                y_train_prob = None
                train_auc = np.nan
            train_recall = recall_score(y_train, y_train_pred)

            # 计算验证集（测试集）预测及指标
            y_pred = grid_search.predict(X_test_scaled)
            if hasattr(grid_search.best_estimator_, 'predict_proba'):
                y_prob = grid_search.predict_proba(X_test_scaled)[:, 1]
                test_auc = roc_auc_score(y_test, y_prob)
            else:
                y_prob = None
                test_auc = np.nan
            test_recall = recall_score(y_test, y_pred)

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
                'Train AUC Score': train_auc,
                'Train Recall Score': train_recall,
                'Test AUC Score': test_auc,
                'Test Recall Score': test_recall
            })
        except Exception as e:
            print(f"{name} failed: {str(e)}")

    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('Test AUC Score', ascending=False)

    print("\n=== Final Results ===")
    print(results_df[['Model', 'Train AUC Score', 'Train Recall Score', 'Test AUC Score', 'Test Recall Score']])

    if not results_df.empty:
        best_model_name = results_df.iloc[0]['Model']
        print(f"\nBest Model: {best_model_name}")
        print(f"Best Test AUC Score: {results_df.iloc[0]['Test AUC Score']:.4f}")
        print(f"Best Test Recall Score: {results_df.iloc[0]['Test Recall Score']:.4f}")

        # 提取模型名称和对应的指标数据
    models_list = results_df['Model']
    indices = np.arange(len(models_list))
    bar_height = 0.4

    fig, (ax1, ax2) = plt.subplots(ncols=2, figsize=(12, len(models_list)*0.5 + 2))

    # AUC 子图
    bars_train_auc = ax1.barh(indices - bar_height/2, results_df['Train AUC Score'], height=bar_height, label='Train AUC')
    bars_test_auc  = ax1.barh(indices + bar_height/2, results_df['Test AUC Score'], height=bar_height, label='Test AUC')

    ax1.set_yticks(indices)
    ax1.set_yticklabels(models_list)
    ax1.set_xlabel('AUC Score')
    ax1.set_title('AUC Comparison')
    ax1.legend()

    # 为 AUC 条形图添加数值标签
    for bar in bars_train_auc:
        width = bar.get_width()
        ax1.text(width - 0.05, bar.get_y() + bar.get_height()/2, f'{width:.3f}', va='center', fontsize=9, color="white")
    for bar in bars_test_auc:
        width = bar.get_width()
        ax1.text(width - 0.05, bar.get_y() + bar.get_height()/2, f'{width:.3f}', va='center', fontsize=9, color="white")

    # 调整 AUC 图 x 轴：如果所有指标均在 0.85 以上，则从 0.85 显示，否则保留 0.5
    min_auc = min(results_df['Train AUC Score'].min(), results_df['Test AUC Score'].min())
    auc_lower_lim = 0.85 if min_auc > 0.85 else 0.5
    ax1.set_xlim(auc_lower_lim, 1.0)

    # Recall 子图
    bars_train_recall = ax2.barh(indices - bar_height/2, results_df['Train Recall Score'], height=bar_height, label='Train Recall')
    bars_test_recall  = ax2.barh(indices + bar_height/2, results_df['Test Recall Score'], height=bar_height, label='Test Recall')

    ax2.set_yticks(indices)
    ax2.set_yticklabels(models_list)
    ax2.set_xlabel('Recall Score')
    ax2.set_title('Recall Comparison')
    ax2.legend()

    # 为 Recall 条形图添加数值标签
    for bar in bars_train_recall:
        width = bar.get_width()
        ax2.text(width - 0.05, bar.get_y() + bar.get_height()/2, f'{width:.3f}', va='center', fontsize=9,color="white")
    for bar in bars_test_recall:
        width = bar.get_width()
        ax2.text(width - 0.05, bar.get_y() + bar.get_height()/2, f'{width:.3f}', va='center', fontsize=9,color="white")

    # 调整 Recall 图 x 轴：如果所有指标均在 0.85 以上，则从 0.85 显示，否则保留 0.5
    min_recall = min(results_df['Train Recall Score'].min(), results_df['Test Recall Score'].min())
    recall_lower_lim = 0.85 if min_recall > 0.85 else 0.5
    ax2.set_xlim(recall_lower_lim, 1.0)

    plt.tight_layout()
    plt.show()


if __name__ == "__main__":
    main()
