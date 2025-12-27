import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import api from './api';
import Login from './pages/Login';
import Register from './pages/Register'; // Certifique-se de que criou este arquivo

// 1. Função para verificar se já existe alguém logado antes de carregar o app
const getUsuarioInicial = () => {
  const usuarioSalvo = localStorage.getItem('usuario');
  const tokenSalvo = localStorage.getItem('token');
  if (usuarioSalvo && tokenSalvo) {
    try { return JSON.parse(usuarioSalvo); } catch { return null; }
  }
  return null;
};

function App() {
  const [usuario, setUsuario] = useState(getUsuarioInicial);
  const [planta, setPlanta] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) {
      setCarregando(false);
      return;
    }

    const carregarApp = async () => {
      setCarregando(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const [plantaRes, climaRes] = await Promise.all([
              api.get('/planta'),
              api.get(`/clima?lat=${latitude}&lon=${longitude}`)
            ]);

            setPlanta({
              ...plantaRes.data,
              temperaturaReal: climaRes.data.temperatura,
              bairroReal: climaRes.data.bairro,
              cidadeReal: climaRes.data.cidade,
              iconeClima: climaRes.data.icone
            });
          } catch (error) {
            console.error("Erro ao buscar dados:", error);
          } finally {
            setCarregando(false);
          }
        },
        (geoError) => {
          console.error("Erro GPS:", geoError);
          setCarregando(false);
        }
      );
    };

    carregarApp();
  }, [usuario]); // Recarrega se o usuário mudar

  const registrarRega = async () => {
    try {
      const response = await api.post('http://localhost:3001/api/regar', {
        nome: "Kalanchoe"
      });
      if (response.status === 200) {
        setPlanta(response.data.dados);
        alert("Planta regada com sucesso!");
      }
    } catch (error) {
      console.error("Erro ao registrar rega:", error);
    }
  };

  const deslogar = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  const obterCorPorTemperatura = (temp) => {
    if (!temp) return 'bg-stone-50 border-stone-100';
    if (temp > 30) return 'bg-red-400 border-red-400 text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)]';
    if (temp > 25) return 'bg-orange-200 border-orange-200 text-orange-950';
    if (temp > 20) return 'bg-yellow-50 border-yellow-50 text-yellow-950';
    return 'bg-emerald-50 border-emerald-50 text-emerald-900';
  };

  const statusAtual = planta?.statusRega;

  return (
    <Routes>
      <Route
        path="/login"
        element={!usuario ? <Login aoLogar={setUsuario} /> : <Navigate to="/" />}
      />
      <Route
        path="/register"
        element={!usuario ? <Register /> : <Navigate to="/" />}
      />
      <Route
        path="/"
        element={
          usuario ? (
            carregando ? (
              <div className="flex flex-col items-center justify-center min-h-screen bg-creme">
                <div className="w-12 h-12 border-4 border-salvia border-t-botanico rounded-full animate-spin"></div>
                <p className="mt-6 text-botanico font-logo text-xl">Preparando seu Jardim...</p>
              </div>
            ) : (
              /* Dashboard */
              <div className="min-h-screen bg-verde font-sans text-stone-900">
                <button onClick={deslogar} className="absolute top-4 right-4 z-50 bg-white/80 px-4 py-2 rounded-full text-[10px] font-black text-red-500 uppercase">
                  Sair
                </button>

                <main className="relative pt-24 px-6 pb-20 max-w-lg mx-auto">
                  {/* Teste Visual: Se a planta não vier da API, usamos um nome padrão para testar */}
                  <h1 className="text-4xl font-logo text-botanico">
                    {planta?.nome || "Minha Planta"}
                  </h1>

                  <p className="text-stone-500 italic mt-2">
                    {planta?.especie || "Espécie não identificada"}
                  </p>

                  {/* Espaço para o Diagnóstico que faremos depois */}
                  <div className="mt-10 p-6 bg-white rounded-4xl shadow-sm border border-stone-100">
                    <p className="text-xs uppercase tracking-widest text-salvia font-black">Status da Rega</p>
                    <p className="text-2xl text-botanico mt-1">{planta?.statusRega || "Aguardando dados..."}</p>
                  </div>
                </main>
              </div>
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;