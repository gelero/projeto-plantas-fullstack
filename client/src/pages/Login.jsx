import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Login = ({ aoLogar }) => {
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
            const response = await axios.post('http://localhost:3001/api/auth/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.user));
            aoLogar(response.data.user);
            navigate('/');
        } catch (err) {
            setErro(err.response?.data?.error || 'Erro ao conectar ao servidor');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-verde px-4">
            <div className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-xl shadow-stone-200/50 border border-stone-100">

                <div className="text-center mb-10">
                    <span className="block text-[10px] font-black uppercase tracking-[0.4em] text-salvia ">
                        O Encanto do
                    </span>
                    <h2 className="text-5xl font-logo text-botanico leading-none">
                        Jardim
                    </h2>
                    <span className="block font-detalhe text-5xl text-terracota -mt-3 ml-12 transform -rotate-3">
                        Perfeito
                    </span>
                    <div className="w-12 h-px bg-terracota/30 mx-auto mt-6"></div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {erro && <div className="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-xl">{erro}</div>}

                    <input
                        type="email"
                        placeholder="Seu e-mail"
                        className="w-full p-3 bg-creme rounded-2xl outline-none focus:ring-1 focus:ring-salvia transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type="password"
                        placeholder="Sua senha"
                        className="w-full p-3 bg-creme rounded-2xl outline-none focus:ring-1 focus:ring-salvia transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={carregando}
                        className="w-full bg-botanico hover:bg-[#1f3d1a] text-creme font-bold py-4 rounded-2xl transition-all shadow-lg shadow-botanico/20 uppercase tracking-widest text-xs"
                    >
                        {carregando ? 'Sincronizando...' : 'Entrar no Jardim'}
                    </button>
                </form>
                {<p className="text-center mt-8 text-[10px] font-black uppercase tracking-widest text-stone-400">
                    Novo por aqui? <Link to="/register" className="text-terracota hover:underline">Crie sua conta</Link>
                </p>}
            </div>
        </div>
    );
};

export default Login;