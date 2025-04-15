import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegressionCV
from sklearn.model_selection import RandomizedSearchCV
from sklearn.metrics import roc_auc_score, recall_score
from sklearn.preprocessing import StandardScaler
from scipy.stats import randint
import matplotlib.pyplot as plt
from collections import defaultdict
import shap
import os
import warnings
warnings.filterwarnings("ignore")

# === 创建输出目录 ===
os.makedirs("python-train-model/output/results/n5", exist_ok=True)
os.makedirs("python-train-model/output/shap_plots/n5", exist_ok=True)

# === 1. 加载数据 ===
train_df = pd.read_csv("python-train-model/data/Train_expr.csv")
test_df = pd.read_csv("python-train-model/data/Test_expr.csv")

train_df["Cohort"] = "Train"
test_df["Cohort"] = "Test"
all_df = pd.concat([train_df, test_df], ignore_index=True)

y = all_df["Group"]
cohort = all_df["Cohort"]

feature_cols = all_df.select_dtypes(include=[np.number]).columns.tolist()
feature_cols = [col for col in feature_cols if col != "Group"]
X = all_df[feature_cols]

# === 2. 按 Cohort 标准化 ===
X_scaled = pd.DataFrame(index=X.index, columns=X.columns)
for grp in cohort.unique():
    idx = cohort == grp
    scaler = StandardScaler()
    X_scaled.loc[idx, :] = scaler.fit_transform(X.loc[idx, :])
X_scaled = X_scaled.astype(float)

X_train = X_scaled[cohort == "Train"]
y_train = y[cohort == "Train"]
X_test = X_scaled[cohort == "Test"]
y_test = y[cohort == "Test"]

# === 3. Lasso 变量初筛 ===
lasso = LogisticRegressionCV(
    cv=10, penalty='l1', solver='saga', scoring='roc_auc',
    max_iter=10000, random_state=42
)
lasso.fit(X_train, y_train)
coef = lasso.coef_[0]
selected_features = X_train.columns[coef != 0]

lasso_importance = pd.DataFrame({
    "Feature": X_train.columns,
    "Lasso_Coefficient": coef
})
lasso_importance = lasso_importance[lasso_importance["Lasso_Coefficient"] != 0]
lasso_importance["Abs_Coefficient"] = lasso_importance["Lasso_Coefficient"].abs()
lasso_importance.sort_values("Abs_Coefficient", ascending=False, inplace=True)
lasso_importance.to_csv("python-train-model/output/results/n5/lasso_feature_importance.csv", index=False)
print("✅ Lasso筛选后的特征数量：", len(selected_features))

# === 4. Minimal Depth 计算函数 ===
def compute_minimal_depth(model, feature_names):
    def traverse_tree(tree, node_id=0, depth=0, found={}):
        feature = tree.feature[node_id]
        if feature != -2:
            f_name = feature_names[feature]
            if f_name not in found:
                found[f_name] = depth
            traverse_tree(tree, tree.children_left[node_id], depth + 1, found)
            traverse_tree(tree, tree.children_right[node_id], depth + 1, found)

    all_depths = defaultdict(list)
    for estimator in model.estimators_:
        tree = estimator.tree_
        found = {}
        traverse_tree(tree, node_id=0, depth=0, found=found)
        for f, d in found.items():
            all_depths[f].append(d)

    avg_min_depth = {f: np.mean(d) for f, d in all_depths.items()}
    return pd.Series(avg_min_depth).sort_values()

# === 5. 定义调参空间 ===
param_dist = {
    'n_estimators': randint(100, 1000),
    'max_depth': [None] + list(range(5, 40, 5)),
    'min_samples_split': randint(2, 10),
    'min_samples_leaf': randint(1, 5),
    'max_features': ['sqrt', 'log2']
}

print("\n🚀 开始基于 Minimal Depth 的逐步特征选择与调参...\n")

# === 6. 逐轮降维 + 每轮重算 Minimal Depth 排序 ===
best_auc = 0
best_features = []
best_params_overall = {}
auc_record = []

current_candidate_features = selected_features.tolist()

for k in range(len(current_candidate_features), 4, -1):
    # 当前轮次使用的特征子集
    X_train_k = X_train[current_candidate_features]

    # 重新训练 RF 并计算 Minimal Depth
    md_model_k = RandomForestClassifier(n_estimators=200, max_depth=None, random_state=42)
    md_model_k.fit(X_train_k, y_train)
    min_depth_k = compute_minimal_depth(md_model_k, current_candidate_features)

    ranked_features_k = min_depth_k.index.tolist()
    current_features = ranked_features_k[:k]

    # 用当前特征做调参
    X_train_sub = X_train[current_features]
    X_test_sub = X_test[current_features]

    rf = RandomForestClassifier(random_state=42)
    random_search = RandomizedSearchCV(
        rf, param_distributions=param_dist,
        n_iter=30, scoring='roc_auc', cv=5,
        random_state=42, n_jobs=-1, verbose=0
    )
    random_search.fit(X_train_sub, y_train)
    best_model = random_search.best_estimator_
    best_params = random_search.best_params_

    y_proba = best_model.predict_proba(X_test_sub)[:, 1]
    y_pred = best_model.predict(X_test_sub)
    auc = roc_auc_score(y_test, y_proba)
    recall = recall_score(y_test, y_pred)

    print(f"✅ Top-{k} 特征 AUC: {auc:.4f}, Recall: {recall:.4f}")

    # 保存特征重要性
    importances = best_model.feature_importances_
    rf_importance = pd.DataFrame({
        "Feature": current_features,
        "Importance": importances
    }).sort_values("Importance", ascending=False)
    rf_importance.to_csv(f"python-train-model/output/results/n5/rf_feature_importance_top_{k}.csv", index=False)

    # 绘制特征重要性图表
    plt.figure(figsize=(10, 6))
    plt.barh(rf_importance["Feature"], rf_importance["Importance"])
    plt.xlabel("Feature Importance")
    plt.ylabel("Feature Name")
    plt.title(f"Top-{k} Feature Importance Ranking")
    plt.tight_layout()
    plt.savefig(f"python-train-model/output/results/n5/feature_importance_plot_top_{k}.png")
    plt.close()

    # 保存 SHAP 图
    explainer = shap.TreeExplainer(best_model)
    shap_values = explainer.shap_values(X_test_sub)

    # 检查SHAP值的结构
    # RandomForest分类器的TreeExplainer返回的shap_values可能有不同的结构
    # 如果是列表，则第二个元素是正类的SHAP值
    # 如果是三维数组，则第三维的第二个元素是正类的SHAP值

    # 保存用于绘图的SHAP值
    if isinstance(shap_values, list):
        # 如果是列表形式 [负类值, 正类值]
        plot_shap_values = shap_values[1]  # 正类的SHAP值
    else:
        # 如果是三维数组
        plot_shap_values = shap_values[:, :, 1]  # 正类的SHAP值

    # 保存 SHAP 图
    plt.figure()
    shap.summary_plot(plot_shap_values, X_test_sub, plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(f"python-train-model/output/shap_plots/n5/shap_summary_top_{k}.png")
    plt.close()

    # 计算并保存SHAP值的平均绝对值（即条形图中显示的值）
    # 这些值与条形图中的长度对应
    shap_summary = pd.DataFrame({
        "Feature": current_features,
        "Mean_Absolute_SHAP": np.abs(plot_shap_values).mean(axis=0)  # 计算每个特征的SHAP值平均绝对值
    }).sort_values("Mean_Absolute_SHAP", ascending=False)  # 按平均绝对SHAP值降序排列

    # 保存SHAP摘要统计值
    shap_summary.to_csv(f"python-train-model/output/shap_plots/n5/shap_summary_top_{k}.csv", index=False)

    auc_record.append({
        "Num_Features": k,
        "AUC": auc,
        "Recall": recall,
        "Features": current_features,
        "Best_Params": best_params
    })

    if auc > best_auc:
        best_auc = auc
        best_features = current_features
        best_params_overall = best_params

    current_candidate_features = current_features

# === 7. 保存所有轮次结果 ===
result_df = pd.DataFrame(auc_record)
result_df.to_csv("python-train-model/output/results/n5/feature_selection_results.csv", index=False)

# === 8. 绘图展示 ===
plt.figure(figsize=(10, 5))
plt.plot(result_df["Num_Features"], result_df["AUC"], marker='o', label='AUC')
plt.plot(result_df["Num_Features"], result_df["Recall"], marker='s', label='Recall', linestyle='--')
plt.xlabel("Number of Features")
plt.ylabel("Score")
plt.title("AUC & Recall vs. Number of Features")
plt.gca().invert_xaxis()
plt.grid(True)
plt.legend()
plt.tight_layout()
plt.savefig("python-train-model/output/results/n5/auc_recall_plot.png")
plt.show()

# === 9. 总结 ===
print("\n🎯 最优结果：")
print("✅ 最佳特征数量：", len(best_features))
print("✅ 最佳AUC：", round(best_auc, 4))
print("✅ 最佳特征组合：", best_features)
print("✅ 对应最优参数：", best_params_overall)