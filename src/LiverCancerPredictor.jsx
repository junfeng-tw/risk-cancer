
import { useState } from "react";

export default function LiverCancerPredictor() {
  const [inputs, setInputs] = useState({
    kcnq1: "",
    linc01785: "",
    age: "",
    afp: "",
    alb: "",
    ggt: ""
  });
  const [result, setResult] = useState(null);

  function calculateScore(kcnq1, linc01785) {
    return kcnq1 * 1.13 + linc01785 * 1.167 - 3.395;
  }

  function predict(lncRNA_score, age, afp, alb, ggt) {
    const intercept = -2.5792;
    const coef = {
      lncRNA: 0.8871,
      age: 0.0627,
      afp: 2.1980,
      alb: -0.0373,
      ggt: 0.0037
    };
    const logit =
      intercept +
      coef.lncRNA * lncRNA_score +
      coef.age * age +
      coef.afp * afp +
      coef.alb * alb +
      coef.ggt * ggt;
    const probability = 1 / (1 + Math.exp(-logit));
    return probability;
  }

  const handleChange = (e) => {
    setInputs({ ...inputs, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const kcnq1 = parseFloat(inputs.kcnq1);
    const linc01785 = parseFloat(inputs.linc01785);
    const age = parseFloat(inputs.age);
    const afp = parseFloat(inputs.afp);
    const alb = parseFloat(inputs.alb);
    const ggt = parseFloat(inputs.ggt);

    if ([kcnq1, linc01785, age, afp, alb, ggt].some(isNaN)) {
      setResult("请填写所有数值参数。");
      return;
    }

    const score = calculateScore(kcnq1, linc01785);
    const probability = predict(score, age, afp, alb, ggt);
    setResult(`预测患病概率为: ${(probability * 100).toFixed(2)}%`);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
      <h1 className="text-2xl font-bold mb-4">肝癌风险预测工具</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            KCNQ1-AS1 in EVs:
            <input
              type="number"
              step="any"
              name="kcnq1"
              value={inputs.kcnq1}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label className="block">
            LINC01785 in EVs:
            <input
              type="number"
              step="any"
              name="linc01785"
              value={inputs.linc01785}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label className="block">
            年龄 Age:
            <input
              type="number"
              step="any"
              name="age"
              value={inputs.age}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label className="block">
            AFP（甲胎蛋白）:
            <input
              type="number"
              step="any"
              name="afp"
              value={inputs.afp}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label className="block">
            ALB（白蛋白）:
            <input
              type="number"
              step="any"
              name="alb"
              value={inputs.alb}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </label>
          <label className="block">
            GGT（谷氨酰转移酶）:
            <input
              type="number"
              step="any"
              name="ggt"
              value={inputs.ggt}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          计算概率
        </button>
      </form>
      {result && <p className="mt-4 text-lg font-semibold text-green-600">{result}</p>}
    </div>
  );
}
