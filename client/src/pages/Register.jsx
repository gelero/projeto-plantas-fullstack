import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCarregando(true);
        setErro('');

        try {
            await axios.post('http://localhost:3001/api/auth/register', {
                nome,
                email,
                password
            });
            // Após cadastrar, envia para o login
            navigate('/login');
        } catch (err) {
            setErro(err.response?.data?.error || 'Erro ao criar conta');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-verde px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl shadow-stone-200/50 border border-stone-100">
                
                <div className="text-center mb-10">
                    <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-salvia mb-1">
                        Faça parte do
                    </span>
                    <h2 className="text-5xl font-logo text-botanico leading-none">
                        Jardim
                    </h2>
                    <span className="block font-detalhe text-4xl text-terracota -mt-3 ml-12 transform -rotate-3">
                        Perfeito
                    </span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {erro && <div className="text-red-500 text-[10px] font-black uppercase text-center bg-red-50 p-3 rounded-xl">{erro}</div>}

                    <input
                        type="text"
                        placeholder="Seu Nome"
                        className="w-full p-4 bg-creme rounded-2xl outline-none focus:ring-2 focus:ring-salvia transition-all"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />

                    <input
                        type="email"
                        placeholder="E-mail"
                        className="w-full p-4 bg-creme rounded-2xl outline-none focus:ring-2 focus:ring-salvia transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Escolha uma Senha"
                        className="w-full p-4 bg-creme rounded-2xl outline-none focus:ring-2 focus:ring-salvia transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={carregando}
                        className="w-full bg-botanico hover:bg-[#1f3d1a] text-creme font-bold py-4 rounded-2xl transition-all shadow-lg shadow-botanico/20 uppercase tracking-widest text-xs"
                    >
                        {carregando ? 'Semeando...' : 'Criar minha conta'}
                    </button>
                </form>

                <p className="text-center mt-8 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    Já cultiva conosco? <Link to="/login" className="text-terracota hover:underline">Entre aqui</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;