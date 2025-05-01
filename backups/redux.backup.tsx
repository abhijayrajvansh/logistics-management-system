import Counter from '@/components/Counter';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-center mb-8">Trucks loading status:</h1>
        <Counter />
      </div>
    </main>
  );
}
