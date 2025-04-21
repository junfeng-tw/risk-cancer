# 肝癌风险评估系统 (HCC Risk Assessment System)

基于机器学习的肝癌风险评估Web应用，整合创新的lncRNA生物标志物与传统临床指标，提供高精度的肝癌风险预测。

## 项目概述

本项目是一个完整的肝癌风险评估解决方案，包含两个主要部分：
1. Python模型训练模块 - 使用机器学习算法训练肝癌风险预测模型
2. Web应用前端 - 基于React的用户界面，在浏览器中运行ONNX模型进行预测

该系统利用创新的lncRNA生物标志物（KCNQ1-AS1和LINC01785）结合传统临床指标（年龄、AFP、白蛋白、γ-GT），构建高精度的肝癌风险评估模型。通过WebAssembly技术，模型可直接在浏览器中运行，无需服务器计算，保护用户数据隐私。

## 功能特点

### 个体风险评估
- 输入lncRNA生物标志物数据和临床参数
- 计算lncRNA评分
- 使用机器学习模型预测肝癌风险概率
- 显示风险等级（低、中、高）

### 批量预测功能
- 支持CSV文件上传进行批量预测
- 提供两种输入模式：表单输入和评分输入
- 自动处理缺失值
- 生成包含预测结果的CSV文件

### 技术亮点
- 浏览器端机器学习（ONNX + WebAssembly）
- 响应式设计，适配不同设备
- 特征选择算法优化的预测模型
- GitHub Pages部署，无需服务器

## 在线演示

访问[HCC Risk Assessment System](https://junfeng-tw.github.io/risk-cancer/)体验在线演示。

## 技术栈

### 前端
- React 19
- Vite
- TailwindCSS
- ONNX Runtime Web

### 模型训练
- Python
- Scikit-learn
- ONNX转换工具

## 本地开发

### 前提条件
- Node.js (v18+)
- Python 3.8+
- Git

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/risk-cancer.git
cd risk-cancer
```

2. 安装前端依赖
```bash
npm install
```

3. 安装Python依赖（用于模型训练）
```bash
cd python-train-model
pip install -r requirements.txt
cd ..
```

4. 启动开发服务器
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
```

## 模型训练流程

项目使用了基于Minimal Depth策略的特征选择与模型训练流程：

1. **Lasso初筛**：使用L1正则化逻辑回归快速删除无关特征
2. **Minimal Depth排序**：使用随机森林分析特征在树中首次分裂的位置
3. **逐步递减特征数**：从最小深度排名中逐步减少特征数量，观察模型性能变化

详细的模型训练流程请参考`python-train-model/README.md`。

## 部署

项目配置了GitHub Actions自动部署到GitHub Pages：

1. 将代码推送到main分支
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. GitHub Actions会自动构建并部署到GitHub Pages

## 项目结构

```
risk-cancer/
├── .github/workflows/    # GitHub Actions配置
├── dist/                 # 构建输出目录
├── public/               # 静态资源
│   └── HistGradientBoosting.onnx  # ONNX模型文件
├── python-train-model/   # Python模型训练代码
│   ├── filterv5.py       # 特征选择算法
│   ├── model_compare_2.py # 模型比较代码
│   └── README.md         # 模型训练说明
├── src/                  # 前端源代码
│   ├── components/       # React组件
│   ├── constants/        # 常量定义
│   ├── hooks/            # 自定义React Hooks
│   ├── services/         # 服务层
│   ├── utils/            # 工具函数
│   ├── LiverCancerPredictor.jsx  # 主应用组件
│   ├── main.jsx          # 应用入口
│   ├── onnxConfig.js     # ONNX配置
│   └── predict.js        # 预测逻辑
├── index.html            # HTML模板
├── package.json          # 项目依赖
├── tailwind.config.js    # TailwindCSS配置
└── vite.config.js        # Vite配置
```

## 使用说明

### 个体预测
1. 在"Individual Prediction"标签页中输入以下数据：
   - KCNQ1-AS1表达水平
   - LINC01785表达水平
   - 年龄
   - AFP水平 (ng/mL)
   - 白蛋白水平 (g/L)
   - γ-GT水平 (U/L)
2. 点击"Calculate Risk"按钮
3. 查看预测结果，包括风险概率和风险等级

### 批量预测
1. 切换到"Batch Prediction"标签页
2. 选择输入模式（表单输入或评分输入）
3. 下载CSV模板
4. 填写数据并上传CSV文件
5. 点击"Process Batch"按钮
6. 查看批量预测结果并下载CSV结果文件

## 贡献指南

欢迎贡献代码、报告问题或提出改进建议。请遵循以下步骤：

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建Pull Request

## 许可证

本项目采用MIT许可证 - 详情请参阅LICENSE文件

## 联系方式

项目维护者 - [习晓丹/任俊峰](mailto:s1184273397@gmail.com)

项目链接: [https://github.com/junfeng-tw/risk-cancer](https://github.com/junfeng-tw/risk-cancer)

## 致谢

- 感谢所有为本项目做出贡献的研究人员和开发者
- 特别感谢[武汉大学中南医院]提供的数据支持
- 本项目研究成果已发表于Nature Communications | DOI: 10.1038/s41467-XXX-XXXXX-X
