import { useState, useEffect } from 'react';
import api from './api';

function App() {
  const [planta, setPlanta] = useState(null);
  /* const [statusRega, setStatusRega] = useState('pendente'); */
  const [carregando, setCarregando] = useState(true);

  // Buscar dados ao carregar a página
  useEffect(() => {
    const carregarApp = async () => {
      setCarregando(true);
      // 1. Pedir localização ao navegador
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // 2. Com as coordenadas, buscar planta e clima
            const [plantaRes, climaRes] = await Promise.all([
              api.get('/planta'),
              api.get(`/clima?lat=${latitude}&lon=${longitude}`) // Passando as coordenadas via Query String
            ]);

            setPlanta({
              ...plantaRes.data,
              temperaturaReal: climaRes.data.temperatura,
              bairroReal: climaRes.data.bairro,
              cidadeReal: climaRes.data.cidade,
              iconeClima: climaRes.data.icone
            });
          } catch (error) {
            console.error("Erro ao buscar dados do servidor:", error);
          } finally {
            setCarregando(false);
          }
        },
        (geoError) => {
          console.error("Usuário negou localização ou erro de GPS:", geoError);
          // Se der erro no GPS, podemos carregar a planta sem o clima real
          setCarregando(false);
        }
      );
    };

    carregarApp();
  }, []);

  const registrarRega = async () => {
    try {
      // Usando axios.post em vez de fetch
      const response = await api.post('http://localhost:3001/api/regar', {
        nome: "Kalanchoe"
      });

      // No Axios, os dados chegam direto em response.data
      if (response.status === 200) {
        setPlanta(response.data.dados);
        alert("Planta regada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao registrar rega com Axios:", error);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const statusAtual = planta?.statusRega;

  const obterCorPorTemperatura = (temp) => {
    if (!temp) return 'bg-stone-50 border-stone-100';

    if (temp > 30) {
      return 'bg-red-400 border-red-400 text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)]';
    }

    if (temp > 25) {
      return 'bg-orange-200 border-orange-200 text-orange-950';
    }

    if (temp > 20) {
      return 'bg-yellow-50 border-yellow-50 text-yellow-950';
    }

    return 'bg-emerald-50 border-emerald-50 text-emerald-900';
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-50">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>

        <div className="mt-6 text-center">
          <h2 className="text-stone-800 font-black tracking-tighter text-xl uppercase">
            Preparando seu Jardim
          </h2>
          <p className="text-stone-400 text-sm font-medium">
            Sincronizando clima e sensores locais...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creme font-sans text-stone-900">
      <div style={{
        width: '100%',
        height: '250px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <img
          src={planta?.imagem}
          className="w-full h-full object-cover object-center"
          style={{
            width: '100%',      // Ocupa toda a largura da div pai
            height: '100%',     // Ocupa toda a altura (que definimos como 250px na div)
            objectFit: 'cover', // <--- ESTE É O ATRIBUTO CHAVE
            display: 'block'
          }}
          alt={planta?.nome}
        />
        {/* Gradiente ajustado para suavizar a transição */}
        <div className="absolute inset-0 bg-linear-to-t from-creme via-transparent to-transparent"></div>
      </div>

      <main className="relative -mt-20 px-6 pb-20 max-w-lg mx-auto">
        <div className="bg-white rounded-[3rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-200/50">

          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-terracota font-black uppercase tracking-[0.2em] text-[10px] mb-1 block">Sua Planta</span>
              <h1 className="text-4xl font-extrabold text-botanico tracking-tight">
                {planta?.nome || "Kalanchoe"}
              </h1>
              <p className="text-stone-400 font-medium italic mt-1 text-sm">
                {planta?.especie || "Flor-da-fortuna"}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-2xl border shadow-sm transition-colors duration-500 ${obterCorPorTemperatura(planta?.temperaturaReal)}`}>
              {planta?.iconeClima && (
                <img
                  src={`https://openweathermap.org/img/wn/${planta.iconeClima}@2x.png`}
                  alt="Clima atual"
                  className="w-12 h-12 -my-2" // Margens negativas para o ícone não empurrar muito os textos
                />
              )}
              <span className="text-xl font-bold tracking-tighter text-center block">
                {planta?.temperaturaReal ? `${planta.temperaturaReal}°` : "--"}
              </span>
              <div className="flex flex-col items-center">
                <p className="text-[9px] font-black uppercase text-center tracking-tighter">
                  {planta?.bairroReal || "LOCALIZANDO..."}
                </p>
                <p className="text-[7px] font-medium opacity-70 uppercase text-center tracking-tight">
                  {planta?.cidadeReal || ""}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-5 rounded-3xl border transition-colors ${statusAtual === 'sucesso' ? 'bg-green-50 border-green-100' : 'bg-creme/30 border-stone-100'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{statusAtual === 'sucesso' ? '✅' : '💧'}</span>
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Água</span>
              </div>
              <p className={`font-bold ${statusAtual === 'sucesso' ? 'text-green-700' : 'text-stone-800'}`}>
                {statusAtual === 'sucesso'
                  ? 'Regada hoje'
                  : (planta?.temperaturaReal > 30 ? '🔥 Rega Urgente!' : 'Precisa de rega')}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-stone-50 border border-stone-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">☀️</span>
                <span className="text-[10px] font-black uppercase text-stone-400 tracking-wider">Luz</span>
              </div>
              <p className="font-bold text-stone-800">Sol Indireto</p>
            </div>
          </div>

          <button
            onClick={registrarRega}
            disabled={statusAtual === 'sucesso'}
            className={`w-full py-5 rounded-4xl font-bold text-lg shadow-xl transition-all active:scale-95 ${statusAtual === 'sucesso'
              ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
              : 'bg-botanico text-white shadow-botanico/30 hover:bg-[#132d23]'
              }`}
          >
            {statusAtual === 'sucesso' ? 'Tarefa Concluída' : 'Registrar Rega'}
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;