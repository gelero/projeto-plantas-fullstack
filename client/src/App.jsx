import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import api from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import AdicionarPlanta from './pages/AdicionarPlanta';

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
  const navigate = useNavigate();

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
  }, [usuario]);

  const registrarRega = async () => {
    try {
      const response = await api.post('/regar', { nome: "Kalanchoe" });
      if (response.status === 200) {
        // Agora pegamos os dados atualizados que vêm do backend (com o novo histórico)
        setPlanta(prev => ({
          ...prev,
          ...response.data.dados
        }));
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

  return (
    <Routes>
      <Route path="/login" element={!usuario ? <Login aoLogar={setUsuario} /> : <Navigate to="/" />} />
      <Route path="/register" element={!usuario ? <Register /> : <Navigate to="/" />} />
      <Route
        path="/"
        element={
          usuario ? (
            carregando ? (
              <div className="flex flex-col items-center justify-center min-h-screen bg-verde text-botanico">
                <div className="w-12 h-12 border-4 border-salvia border-t-botanico rounded-full animate-spin"></div>
                <p className="mt-6 font-logo text-xl">Preparando seu Jardim...</p>
              </div>
            ) : (
              <div className="min-h-screen bg-verde font-sans text-stone-900 pb-10">
                <button
                  onClick={() => navigate('/adicionar')}
                  className="fixed bottom-8 right-6 z-50 bg-botanico text-white w-14 h-14 rounded-full shadow-2xl shadow-botanico/40 flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all"
                >
                  <span className="text-3xl leading-none mb-1">+</span>
                </button>
                <button onClick={deslogar} className="absolute top-6 right-6 z-50 bg-white shadow-sm px-4 py-2 rounded-full text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-50">
                  Sair
                </button>

                <main className="relative pt-20 px-6 max-w-lg mx-auto space-y-8">
                  {/* Cabeçalho */}
                  <header className="flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-salvia">Meu Jardim</span>
                      <h1 className="text-5xl font-logo text-botanico mt-1">{planta?.nome || "Planta"}</h1>
                      <p className="text-stone-400 italic text-sm">{planta?.especie}</p>
                    </div>
                    {planta?.temperaturaReal && (
                      <div className="text-right">
                        <span className="block text-3xl font-light text-terracota">{Math.round(planta.temperaturaReal)}°C</span>
                        <span className="text-[9px] font-bold uppercase text-stone-400">{planta.bairroReal}</span>
                      </div>
                    )}
                  </header>

                  {/* Card de Status e Ação */}
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-stone-200/40 border border-stone-100">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-salvia mb-2">Status da Planta</h3>
                    <p className="text-3xl font-medium text-botanico leading-tight">
                      {planta?.statusRega === 'sucesso' ? 'Planta Hidratada!' : 'Aguardando Rega'}
                    </p>
                    <button
                      onClick={registrarRega}
                      className="mt-6 w-full bg-botanico text-creme font-bold py-4 rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
                    >
                      💧 Registrar Rega Hoje
                    </button>
                  </div>

                  {/* Diário de Rega Dinâmico */}
                  <section>
                    <h4 className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-4">Diário de Rega</h4>
                    <div className="space-y-3">
                      {planta?.historico?.length > 0 ? (
                        [...planta.historico].reverse().map((item, index) => (
                          <div key={index} className="bg-white border border-stone-100 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-salvia/10 rounded-full flex items-center justify-center text-salvia">🚿</div>
                              <div>
                                <p className="text-sm font-bold text-botanico">Rega Manual</p>
                                <p className="text-[10px] text-stone-400 uppercase font-medium">
                                  {new Date(item.data).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-salvia bg-salvia/5 px-2 py-1 rounded">OK</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-10 text-stone-300 text-xs italic bg-white/30 rounded-2xl border border-dashed border-stone-200">
                          Nenhuma atividade registrada.
                        </p>
                      )}
                    </div>
                  </section>
                </main>
              </div>
            )
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route path="/adicionar" element={usuario ? <AdicionarPlanta usuario={usuario} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;