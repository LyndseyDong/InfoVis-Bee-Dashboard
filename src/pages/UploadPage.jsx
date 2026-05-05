import { useState, useRef } from 'react';
import Papa from 'papaparse';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';

const DATA_TYPES = [
  {
    key: 'miteCount',
    label: 'Mite Count',
    icon: '🔬',
    columns: ['hiveId', 'date', 'miteCount', 'beeSample'],
    example: 'Hive1,2025-06-15,4,HalfCup',
    notes: 'beeSample: HalfCup or Cup',
  },
  {
    key: 'hiveWeight',
    label: 'Hive Weight',
    icon: '⚖️',
    columns: ['hiveId', 'date', 'weight'],
    example: 'Hive1,2025-06-15,87.5',
    notes: 'weight in lbs',
  },
  {
    key: 'honeyHarvest',
    label: 'Honey Harvest',
    icon: '🍯',
    columns: ['hiveId', 'date', 'pounds'],
    example: 'Hive1,2025-08-10,32',
    notes: 'pounds of honey harvested',
  },
  {
    key: 'hiveEvents',
    label: 'Hive Events',
    icon: '📋',
    columns: ['hiveId', 'date', 'event', 'notes'],
    example: 'Hive1,2025-05-01,Split,Divided into two colonies',
    notes: 'event: HiveDeath, Replaced, or Split',
  },
  {
    key: 'treatments',
    label: 'Treatments',
    icon: '💊',
    columns: ['hiveId', 'date', 'treatment'],
    example: 'H1,2025-06-20,Oxalic Acid',
    notes: 'hiveId uses H1–H5 format for treatments',
  },
  {
    key: 'profit',
    label: 'Revenue / Profit',
    icon: '💰',
    columns: ['date', 'itemSold', 'totalRevenue'],
    example: '2025-07-01,Raw Honey Jar,120.00',
    notes: 'totalRevenue in dollars',
  },
  {
    key: 'expenses',
    label: 'Expenses',
    icon: '🧾',
    columns: ['date', 'category', 'totalCost'],
    example: '2025-07-15,Equipment,45.00',
    notes: 'category: Equipment, Medication, Supplies, Consumable',
  },
  {
    key: 'vaccines',
    label: 'Vaccines',
    icon: '💉',
    columns: ['hiveId', 'date', 'vaccine'],
    example: 'H1,2025-06-20,Nosema Treatment',
    notes: 'hiveId uses H1–H5 format',
  },
];

export default function UploadPage() {
  const { refreshData } = useApp();
  const [selectedType, setSelectedType] = useState(DATA_TYPES[0]);
  const [rows, setRows]     = useState([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [lastUpload, setLastUpload] = useState(null); // { type, rows }
  const fileRef = useRef();

  const handleTypeChange = (key) => {
    setSelectedType(DATA_TYPES.find(d => d.key === key));
    setRows([]);
    setFileName('');
    setParseError('');
    setStatus(null);
    setLastUpload(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError('');
    setRows([]);
    setStatus(null);
    setLastUpload(null);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: ({ data }) => {
        // Strip header row if it matches column names
        const firstRow = data[0]?.map(c => c.trim().toLowerCase()) || [];
        const cols = selectedType.columns.map(c => c.toLowerCase());
        const hasHeader = cols.every(c => firstRow.includes(c));
        const dataRows = hasHeader ? data.slice(1) : data;

        if (dataRows.length === 0) {
          setParseError('No data rows found in the file.');
          return;
        }

        const parsed = dataRows.map(row =>
          Object.fromEntries(selectedType.columns.map((col, i) => [col, (row[i] ?? '').trim()]))
        );
        setRows(parsed);
      },
      error: (err) => setParseError(`Parse error: ${err.message}`),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (!rows.length) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/upload/${selectedType.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setStatusMsg(`Successfully inserted ${data.inserted} row${data.inserted !== 1 ? 's' : ''} into ${selectedType.label}.`);
        setLastUpload({ type: selectedType, rows: [...rows] });
        setRows([]);
        setFileName('');
        if (fileRef.current) fileRef.current.value = '';
        await refreshData();
      } else {
        setStatus('error');
        setStatusMsg(data.error || 'Upload failed.');
      }
    } catch (e) {
      setStatus('error');
      setStatusMsg('Network error — is the server running?');
    }
  };

  return (
    <div className="page">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8 fade-in">

        {/* Header */}
        <div className="mb-7">
          <h2 className="font-fredoka text-2xl text-amber-900">📤 Upload Data</h2>
          <p className="text-amber-400 text-sm mt-0.5 font-nunito">
            Import CSV files to add new records to the hive database.
          </p>
        </div>

        <div className="flex gap-6 flex-wrap items-start">

          {/* Left: type selector */}
          <div className="w-64 shrink-0 flex flex-col gap-4">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4">
              <p className="font-fredoka text-sm text-amber-800 mb-3">Select Data Type</p>
              <div className="flex flex-col gap-1">
                {DATA_TYPES.map(dt => (
                  <button key={dt.key} onClick={() => handleTypeChange(dt.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-left transition-all font-nunito ${
                      selectedType.key === dt.key
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    <span>{dt.icon}</span> {dt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: upload + preview */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-4">

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="bg-white border-2 border-dashed border-amber-300 rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-all"
            >
              <span className="text-4xl">📁</span>
              <div className="text-center">
                <p className="font-bold text-amber-700 text-sm font-nunito">Drop your CSV here</p>
                <p className="text-xs text-amber-400 font-nunito mt-0.5">or click to browse</p>
              </div>
              {fileName && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 text-xs font-semibold font-nunito">
                  ✓ {fileName}
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => handleFile(e.target.files[0])}
              />
            </div>

            {/* Column guide */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="font-fredoka text-sm text-amber-800 mb-2">{selectedType.icon} {selectedType.label} Format</p>
              <div className="flex flex-col gap-1 mb-3">
                {selectedType.columns.map((col, i) => (
                  <div key={col} className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400 font-nunito w-4">{i + 1}.</span>
                    <code className="text-xs bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-700">{col}</code>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-amber-400 font-nunito mb-1">Example row:</p>
              <code className="text-[10px] text-amber-600 bg-white border border-amber-200 rounded px-2 py-1 block break-all">
                {selectedType.example}
              </code>
              {selectedType.notes && (
                <p className="text-[10px] text-amber-500 mt-2 font-nunito">ℹ️ {selectedType.notes}</p>
              )}
            </div>

            {/* Parse error */}
            {parseError && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-nunito">
                ⚠️ {parseError}
              </div>
            )}

            {/* Status banner */}
            {status === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-nunito">
                ✅ {statusMsg}
              </div>
            )}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-nunito">
                ❌ {statusMsg}
              </div>
            )}

            {/* Last uploaded table */}
            {lastUpload && (
              <div className="bg-white border border-green-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-green-100 bg-green-50 flex items-center gap-2">
                  <span className="text-green-600 text-sm">✅</span>
                  <p className="font-fredoka text-sm text-green-800">
                    {lastUpload.type.icon} {lastUpload.type.label} — {lastUpload.rows.length} row{lastUpload.rows.length !== 1 ? 's' : ''} imported
                  </p>
                </div>
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-green-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-green-500 font-bold uppercase tracking-wide font-nunito">#</th>
                        {lastUpload.type.columns.map(col => (
                          <th key={col} className="text-left px-3 py-2 text-green-500 font-bold uppercase tracking-wide font-nunito">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lastUpload.rows.map((row, i) => (
                        <tr key={i} className="border-t border-green-50 hover:bg-green-50/50">
                          <td className="px-3 py-2 text-green-300 font-nunito">{i + 1}</td>
                          {lastUpload.type.columns.map(col => (
                            <td key={col} className="px-3 py-2 text-amber-800 font-nunito">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview table */}
            {rows.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-amber-100">
                  <p className="font-fredoka text-sm text-amber-900">
                    Preview — {rows.length} row{rows.length !== 1 ? 's' : ''} ready to import
                  </p>
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    className="bg-honey-600 hover:bg-honey-700 disabled:opacity-60 text-white font-bold text-sm rounded-full px-5 py-1.5 transition-colors font-nunito"
                  >
                    {status === 'loading' ? 'Uploading…' : `Import ${rows.length} Row${rows.length !== 1 ? 's' : ''}`}
                  </button>
                </div>
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-amber-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-amber-400 font-bold uppercase tracking-wide font-nunito">#</th>
                        {selectedType.columns.map(col => (
                          <th key={col} className="text-left px-3 py-2 text-amber-400 font-bold uppercase tracking-wide font-nunito">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-t border-amber-50 hover:bg-amber-50/50">
                          <td className="px-3 py-2 text-amber-300 font-nunito">{i + 1}</td>
                          {selectedType.columns.map(col => (
                            <td key={col} className="px-3 py-2 text-amber-800 font-nunito">{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                      {rows.length > 50 && (
                        <tr>
                          <td colSpan={selectedType.columns.length + 1} className="px-3 py-2 text-center text-amber-400 text-xs font-nunito">
                            … and {rows.length - 50} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
