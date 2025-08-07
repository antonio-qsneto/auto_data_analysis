import React from "react";
import financeGif from "../../assets/gifs/finance.gif";
import marketing from "../../assets/gifs/marketing.gif";

const useCases = [
  {
    title: "Finance Analyst",
    description: "Analyze balance sheets, forecast cash flow, and track financial KPIs with smart visualizations.",
    image: financeGif,
  },
  {
    title: "Marketing",
    description: "Visualize acquisition metrics, campaign performance, and conversion rates with clean dashboards.",
    image: marketing,
  },
  {
    title: "Operations",
    description: "Forecast demand, monitor supply chains, and optimize inventory in real-time.",
    image: "/images/operations-chart.png",
  },
  {
    title: "Business Owners",
    description: "Quickly upload spreadsheets and gain instant clarity on profit, expenses, and business trends.",
    image: "/images/business-chart.png",
  },
  {
    title: "Data Science",
    description: "Clean, prepare, and explore datasets interactively with AI-assisted suggestions.",
    image: "/images/data-science-chart.png",
  },
  {
    title: "Scientific Research",
    description: "Explore complex datasets, correlations, and outliers for deeper insights.",
    image: "/images/science-chart.png",
  },
];

export default function UseCases() {
  return (
    <section className="bg-[#f9f9f9] py-16 px-4 md:px-12">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">\          XClarity adapts to your data, no matter what it is.
        </h2>
        <p className="text-lg text-gray-600 mb-12">
          From financial reports to scientific experiments, see how XClarity supports your analysis.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#F5F5F5] rounded-2xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.description}</p>
              </div>
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-48 object-cover rounded-xl"
              />
              <button className="mt-4 text-indigo-600 font-medium hover:underline text-left">
                Try it out →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
