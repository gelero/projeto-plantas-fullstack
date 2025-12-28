import { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

const AdicionarPlanta = ({ usuario }) => {
  const [nome, setNome] = useState('');
  const [especie, setEspecie] = useState('');
  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagem(file);
      setPreview(URL.createObjectURL(file)); // Cria uma URL temporária para mostrar a foto na tela
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    // Tenta pegar o ID da prop, se não existir, tenta do localStorage
    const storageUser = JSON.parse(localStorage.getItem('usuario'));
    const idFinal = usuario?.id || usuario?._id || storageUser?.id || storageUser?._id;

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('especie', especie);
    
    if (idFinal) {
      formData.append('userId', idFinal);
    } else {
      console.warn("⚠️ Nenhum ID de usuário encontrado no envio.");
    }

    if (imagem) formData.append('imagem', imagem);

    // ... restante do código (try/catch) igual

    try {
      await api.post('/plantas', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert("Planta cadastrada com sucesso!");
      navigate('/');
    } catch (err) {
      console.error("Erro ao cadastrar:", err);
      alert("Falha ao salvar a planta.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-creme p-6 flex flex-col items-center">
      <header className="w-full max-w-md mb-10">
        <button onClick={() => navigate('/')} className="cursor-pointer text-botanico font-bold">← Voltar</button>
        <h2 className="text-3xl font-logo text-botanico mt-4">Nova Planta</h2>
      </header>

      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        {/* Upload de Imagem */}
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-4xl p-4 bg-white shadow-sm">
          {preview ? (
            <img src={preview} alt="Preview" className="w-40 h-40 object-cover rounded-2xl mb-4" />
          ) : (
            <div className="text-4xl mb-2 text-stone-300">📸</div>
          )}
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className="text-xs text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-salvia file:text-white cursor-pointer"
          />
        </div>

        {/* Inputs de Texto */}
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Dê um nome (ex: Filó)" 
            className="bg-salvia/12 w-full p-4 rounded-2xl border border-stone-200 focus:outline-salvia "
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input 
            type="text" 
            placeholder="Espécie (Opcional)" 
            className=" bg-salvia/12 w-full p-4 rounded-2xl border border-stone-200 focus:outline-salvia"
            value={especie}
            onChange={(e) => setEspecie(e.target.value)}
          />
        </div>

        <button 
          disabled={carregando}
          className="w-full bg-botanico text-white py-4 rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-botanico/20 cursor-pointer"
        >
          {carregando ? "Salvando..." : "Cadastrar no Jardim"}
        </button>
      </form>
    </div>
  );
};

export default AdicionarPlanta;