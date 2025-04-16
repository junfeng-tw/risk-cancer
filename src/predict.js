import * as ort from "onnxruntime-web";

// 定义均值与标准差（请确认数值正确）
const SCALER_MEANS = [2.5088337412890174, 55.01156069364162, 4224.481387283237, 37.57687861271676, 108.29479768786128];
const SCALER_SCALES = [5.591347357350493, 12.830143534402424, 15972.701775588, 6.321121358433146, 126.6698855890084];

/**
 * 提前加载模型，并将 session 缓存到模块级变量中，
 * 避免每次预测时都重新加载模型，提高效率。
 */
const sessionPromise = ort.InferenceSession.create("./HistGradientBoosting.onnx")
    .then((session) => {
        console.log("模型加载完成");
        console.log("模型输入名称:", session.inputNames);
        console.log("模型输出名称:", session.outputNames);
        return session;
    })
    .catch((error) => {
        console.error("加载模型失败:", error);
        throw error;
    });

/**
 * 标准化输入数据
 * @param {Array<number>} rawInputs - 原始输入数组
 * @returns {Array<number>} - 标准化后的数据
 */
const standardizeInputs = (rawInputs) => {
    console.log("原始输入值:", rawInputs);
    const standardized = rawInputs.map((value, index) => {
        const standardizedValue = (value - SCALER_MEANS[index]) / SCALER_SCALES[index];
        console.log(`输入 ${index + 1} 标准化: ${value} -> ${standardizedValue}`);
        return standardizedValue;
    });
    console.log("标准化后的值:", standardized);
    return standardized;
};

/**
 * 预测函数，异步返回类别为 1 的概率
 * @param {Array<number>} input - 输入数据（数组长度应与 SCALER_MEANS 和 SCALER_SCALES 保持一致）
 * @returns {Promise<number>} - 概率值（类别 1 的概率）
 */
async function predict(input) {
    try {
        // 预处理：标准化输入数据
        const standardizedInput = standardizeInputs(input);

        // 创建 ONNX 张量（自动根据输入长度确定维度）
        console.log("创建ONNX张量");
        const tensor = new ort.Tensor("float32", Float32Array.from(standardizedInput), [1, standardizedInput.length]);
        console.log("张量创建完成:", tensor);

        // 等待模型加载完成
        const session = await sessionPromise;

        // 设置预测输入
        const feeds = { float_input: tensor };
        console.log("准备进行预测，输入:", feeds);

        // 运行模型
        const results = await session.run(feeds);
        console.log("模型运行完成，原始结果:", results);

        // 提取并处理预测结果
        console.log("=== 标签输出 ===");
        const labelData = Array.from(results.label.data);
        console.log("标签数据:", labelData);

        console.log("=== 概率输出 ===");
        const probData = Array.from(results.probabilities.data);
        console.log("概率数据:", probData);

        // 概率数据数组中下标 1 对应类别 1 的概率（假设只有两个类别）
        console.log("格式化后的概率:", { '0': probData[0], '1': probData[1] });
        return probData[1];
    } catch (error) {
        console.error("预测过程中出错:", error);
        throw error;
    }
}

export default predict;
