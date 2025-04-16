# 前略：原始 import 保持不变

import pandas as pd
import numpy as np
import os
import joblib
import warnings
import m2cgen as m2c
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, recall_score, accuracy_score, make_scorer, confusion_matrix
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
    confusion_matrices = {}  # 用于汇总子图拼接
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

            # Train Set
            y_train_pred = grid_search.predict(X_train_scaled)
            y_train_prob = grid_search.predict_proba(X_train_scaled)[:, 1] if hasattr(grid_search.best_estimator_, 'predict_proba') else None
            train_auc = roc_auc_score(y_train, y_train_prob) if y_train_prob is not None else np.nan
            train_recall = recall_score(y_train, y_train_pred)
            train_accuracy = accuracy_score(y_train, y_train_pred)
            cm_train = confusion_matrix(y_train, y_train_pred)
            tn_train, fp_train, fn_train, tp_train = cm_train.ravel() if cm_train.shape == (2, 2) else (np.nan,)*4
            train_specificity = tn_train / (tn_train + fp_train) if (tn_train + fp_train) > 0 else np.nan

            # Test Set
            y_pred = grid_search.predict(X_test_scaled)
            y_prob = grid_search.predict_proba(X_test_scaled)[:, 1] if hasattr(grid_search.best_estimator_, 'predict_proba') else None
            test_auc = roc_auc_score(y_test, y_prob) if y_prob is not None else np.nan
            test_recall = recall_score(y_test, y_pred)
            test_accuracy = accuracy_score(y_test, y_pred)
            cm_test = confusion_matrix(y_test, y_pred)
            confusion_matrices[name] = cm_test
            tn_test, fp_test, fn_test, tp_test = cm_test.ravel() if cm_test.shape == (2, 2) else (np.nan,)*4
            test_specificity = tn_test / (tn_test + fp_test) if (tn_test + fp_test) > 0 else np.nan

            # 保存混淆矩阵 CSV
            cm_df = pd.DataFrame(cm_test, index=['Actual 0', 'Actual 1'], columns=['Predicted 0', 'Predicted 1'])
            cm_df.to_csv(os.path.join(output_dir, f"{name}_confusion_matrix.csv"))

            # 单独绘图
            plt.figure(figsize=(4, 3))
            plt.imshow(cm_test, interpolation='nearest', cmap=plt.cm.Blues)
            plt.title(f"{name} Confusion Matrix")
            plt.colorbar()
            tick_marks = np.arange(2)
            plt.xticks(tick_marks, ['Pred 0', 'Pred 1'])
            plt.yticks(tick_marks, ['True 0', 'True 1'])
            thresh = cm_test.max() / 2.
            for i, j in np.ndindex(cm_test.shape):
                plt.text(j, i, format(cm_test[i, j], 'd'),
                         ha="center", va="center",
                         color="white" if cm_test[i, j] > thresh else "black")
            plt.tight_layout()
            plt.savefig(os.path.join(output_dir, f"{name}_confusion_matrix.png"))
            plt.close()

            # 保存模型
            joblib.dump(grid_search.best_estimator_, os.path.join(output_dir, f"{name}.pkl"))

            # JavaScript + ONNX 处理（略）

            results.append({
                'Model': name,
                'Best Parameters': grid_search.best_params_,
                'Train AUC Score': train_auc,
                'Train Sensitivity': train_recall,
                'Train Specificity': train_specificity,
                'Train Accuracy': train_accuracy,
                'Test AUC Score': test_auc,
                'Test Sensitivity': test_recall,
                'Test Specificity': test_specificity,
                'Test Accuracy': test_accuracy
            })

        except Exception as e:
            print(f"{name} failed: {str(e)}")

    # 排序输出
    results_df = pd.DataFrame(results)
    results_df = results_df.sort_values('Test AUC Score', ascending=False)
    results_df.to_csv("python-train-model/output/results/model_comparison_results.csv", index=False)

    # 🔥 汇总所有混淆矩阵拼图展示
    num_models = len(confusion_matrices)
    cols = 3
    rows = (num_models + cols - 1) // cols
    fig, axes = plt.subplots(rows, cols, figsize=(cols * 4, rows * 4))
    axes = axes.flatten()
    for i, (model_name, cm) in enumerate(confusion_matrices.items()):
        ax = axes[i]
        ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
        ax.set_title(model_name)
        ax.set_xticks(np.arange(2))
        ax.set_yticks(np.arange(2))
        ax.set_xticklabels(['Pred 0', 'Pred 1'])
        ax.set_yticklabels(['True 0', 'True 1'])
        for j, k in np.ndindex(cm.shape):
            ax.text(k, j, format(cm[j, k], 'd'), ha="center", va="center",
                    color="white" if cm[j, k] > cm.max() / 2. else "black")
    for j in range(i + 1, len(axes)):
        fig.delaxes(axes[j])
    plt.tight_layout()
    plt.savefig(os.path.join(output_dir, "all_confusion_matrices.png"))
    plt.close()


if __name__ == "__main__":
    main()
