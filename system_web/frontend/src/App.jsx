import ChartComponent from './components/ChartComponent';

function App() {
  const exampleData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
    values: [10, 20, 15, 30, 25]
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Auto Data Analysis Dashboard</h1>
      <ChartComponent data={exampleData} />
    </div>
  );
}

export default App;
