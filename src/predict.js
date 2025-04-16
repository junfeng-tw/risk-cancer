import * as ort from "onnxruntime-web";
const SCALER_MEANS = [2.5088337412890174, 55.01156069364162, 4224.481387283237, 37.57687861271676, 108.29479768786128]; // 替换为实际的均值
const SCALER_SCALES = [5.591347357350493, 12.830143534402424, 15972.701775588, 6.321121358433146, 126.6698855890084];    // 替换为实际的标准差
async function predict(input) {
    const standardizedInput = standardizeInputs(input);
    // 创建ONNX张量
    console.log("创建ONNX张量");
    const tensor = new ort.Tensor("float32", Float32Array.from(standardizedInput), [1, 5]);
    console.log("张量创建完成:", tensor);

    // 加载和运行模型
    console.log("开始加载模型");
    const session = await ort.InferenceSession.create("./models/HistGradientBoosting.onnx");
    console.log("模型加载完成");
    console.log("模型输入名称:", session.inputNames);
    console.log("模型输出名称:", session.outputNames);

    const feeds = { float_input: tensor };
    console.log("准备进行预测，输入:", feeds);

    const results = await session.run(feeds);
    console.log("模型运行完成，原始结果:", results);

    // 处理预测结果
    console.log("=== 标签输出 ===");
    const labelData = Array.from(results.label.data);
    console.log("标签数据:", labelData);

    console.log("=== 概率输出 ===");
    const probData = Array.from(results.probabilities.data);
    console.log("概率数据:", probData);

    // 概率数据是一个长度为2的数组，表示两个类别的概率
    const formattedProbs = {
        '0': probData[0],
        '1': probData[1]
    };

    console.log("格式化后的概率:", formattedProbs);
    return probData[1];
}

// 标准化输入数据
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

export default predict;