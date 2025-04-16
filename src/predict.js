import * as ort from "onnxruntime-web";

// Scaler means and standard deviations for input normalization
const SCALER_MEANS = [2.5088337412890174, 55.01156069364162, 4224.481387283237, 37.57687861271676, 108.29479768786128];
const SCALER_SCALES = [5.591347357350493, 12.830143534402424, 15972.701775588, 6.321121358433146, 126.6698855890084];

/**
 * Pre-load the model and cache the session at module level
 * to avoid reloading the model for each prediction, improving efficiency.
 */
const sessionPromise = ort.InferenceSession.create("./HistGradientBoosting.onnx")
    .then((session) => {
        console.log("Model loaded successfully");
        console.log("Model input names:", session.inputNames);
        console.log("Model output names:", session.outputNames);
        return session;
    })
    .catch((error) => {
        console.error("Failed to load model:", error);
        throw error;
    });

/**
 * Standardize input data using pre-defined means and scales
 * @param {Array<number>} rawInputs - Raw input array
 * @returns {Array<number>} - Standardized data
 */
const standardizeInputs = (rawInputs) => {
    console.log("Raw input values:", rawInputs);
    const standardized = rawInputs.map((value, index) => {
        const standardizedValue = (value - SCALER_MEANS[index]) / SCALER_SCALES[index];
        console.log(`Input ${index + 1} standardized: ${value} -> ${standardizedValue}`);
        return standardizedValue;
    });
    console.log("Standardized values:", standardized);
    return standardized;
};

/**
 * Prediction function that asynchronously returns the probability of class 1
 * @param {Array<number>} input - Input data (array length should match SCALER_MEANS and SCALER_SCALES)
 * @returns {Promise<number>} - Probability value (probability of class 1)
 */
async function predict(input) {
    try {
        // Preprocessing: standardize input data
        const standardizedInput = standardizeInputs(input);

        // Create ONNX tensor (automatically determine dimensions based on input length)
        console.log("Creating ONNX tensor");
        const tensor = new ort.Tensor("float32", Float32Array.from(standardizedInput), [1, standardizedInput.length]);
        console.log("Tensor created:", tensor);

        // Wait for model to load
        const session = await sessionPromise;

        // Set prediction input
        const feeds = { float_input: tensor };
        console.log("Ready for prediction, input:", feeds);

        // Run the model
        const results = await session.run(feeds);
        console.log("Model execution complete, raw results:", results);

        // Extract and process prediction results
        console.log("=== Label Output ===");
        const labelData = Array.from(results.label.data);
        console.log("Label data:", labelData);

        console.log("=== Probability Output ===");
        const probData = Array.from(results.probabilities.data);
        console.log("Probability data:", probData);

        // Index 1 in the probability data array corresponds to the probability of class 1 (assuming only two classes)
        console.log("Formatted probabilities:", { '0': probData[0], '1': probData[1] });
        return probData[1];
    } catch (error) {
        console.error("Error during prediction:", error);
        throw error;
    }
}

export default predict;
