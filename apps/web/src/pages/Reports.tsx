import { Link } from 'react-router-dom';
import { useGenomeStore } from '../store/genome';

const reportTypes = [
  {
    id: 'disease_risk',
    name: 'Disease Risk Report',
    description: 'Pathogenic variants and associated health conditions',
    icon: '🏥'
  },
  {
    id: 'pharmacogenomics',
    name: 'Pharmacogenomics Report',
    description: 'Drug metabolism and medication interactions',
    icon: '💊'
  },
  {
    id: 'carrier_status',
    name: 'Carrier Status Report',
    description: 'Recessive conditions you may carry',
    icon: '🧬'
  },
  {
    id: 'ancestry_traits',
    name: 'Ancestry & Traits',
    description: 'Population frequencies and trait associations',
    icon: '🌍'
  }
];

export default function ReportsPage() {
  const genome = useGenomeStore((state) => state.genome);

  if (!genome) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">No Genome Loaded</h1>
        <p className="mt-2 text-gray-600">Upload a genome file to generate reports.</p>
        <Link
          to="/upload"
          className="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-white font-medium hover:bg-primary-700"
        >
          Upload Genome
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      <p className="mt-2 text-gray-600">
        Generate detailed reports based on your genetic data.
      </p>

      {/* Report Types */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            className="rounded-lg border border-gray-200 bg-white p-6 text-left hover:border-primary-300 transition-colors"
            onClick={() => {
              // TODO: Implement report generation
              alert(`${report.name} generation coming soon!`);
            }}
          >
            <div className="text-3xl mb-4">{report.icon}</div>
            <h3 className="font-semibold text-gray-900">{report.name}</h3>
            <p className="mt-2 text-sm text-gray-600">{report.description}</p>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <h3 className="font-semibold text-yellow-800">Important Notice</h3>
        <p className="mt-2 text-sm text-yellow-700">
          These reports are for informational purposes only and should not be used for medical
          diagnosis or treatment decisions. Always consult with qualified healthcare professionals.
        </p>
      </div>
    </div>
  );
}
