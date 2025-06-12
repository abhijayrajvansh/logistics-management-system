export default function FontTestPage() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Font Weight Test Page</h1>

      <div className="space-y-2">
        <p className="font-light text-lg">Font Light (300) - This text should be light</p>
        <p className="font-normal text-lg">Font Normal (400) - This text should be normal</p>
        <p className="font-medium text-lg">Font Medium (500) - This text should be medium</p>
        <p className="font-semibold text-lg">Font Semibold (600) - This text should be semibold</p>
        <p className="font-bold text-lg">Font Bold (700) - This text should be bold</p>
        <p className="font-extrabold text-lg">
          Font Extrabold (800) - This text should be extra bold
        </p>
      </div>

      <div className="mt-8 p-4 border rounded">
        <h2 className="font-semibold text-xl mb-2">Testing in Components</h2>
        <button className="bg-blue-500 text-white px-4 py-2 rounded font-medium mr-2">
          Medium Button
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded font-semibold">
          Semibold Button
        </button>
      </div>
    </div>
  );
}
