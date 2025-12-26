import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

const mongoURI =process.env.MONGO_URI /* 'mongodb+srv://admin:rvyeKRPBneLav5f3@projetoplantas.08nk78c.mongodb.net/ProjetoPlantas?retryWrites=true&w=majority' */;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ CONECTADO AO MONGODB ATLAS"))
  .catch(err => console.error("❌ ERRO DE CONEXÃO:", err));

const PlantaSchema = new mongoose.Schema({
  nome: String,
  especie: String,
  statusRega: String,
  ultimaRega: Date,
  temperatura: Number,
  imagem: String
});

const Planta = mongoose.model('Planta', PlantaSchema);

/* criando schema usuario */
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nome: String
});

const User = mongoose.model('User', UserSchema);

/* rota de cadastro de usuario */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nome } = req.body;

    // Verificar se usuário já existe
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ error: "Email já cadastrado" });

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword, nome });
    await newUser.save();

    res.status(201).json({ message: "Usuário criado com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* rota de login */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "Usuário não encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Senha incorreta" });

    // Criar o Token (Vale por 1 dia)
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });

    res.json({ token, user: { nome: user.nome, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/planta', async (req, res) => {
  try {
    // 1. Tenta apagar tudo que existe para limpar o lixo (SÓ PARA TESTE AGORA)
    // await Planta.deleteMany({}); 

    let planta = await Planta.findOne({ nome: "Kalanchoe" });

    if (!planta) {
      console.log("⚠️ Planta não encontrada. Criando nova...");
      planta = new Planta({
        nome: "Kalanchoe",
        especie: "Flor-da-fortuna",
        statusRega: "pendente",
        ultimaRega: new Date(),
        temperatura: 32,
        imagem: "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500"
      });
      await planta.save();
      console.log("✨ Nova planta salva com sucesso no banco!");
    }

    res.json(planta);
  } catch (err) {
    console.error("❌ ERRO NA ROTA GET:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/regar', async (req, res) => {
  try {
    const planta = await Planta.findOneAndUpdate(
      { nome: "Kalanchoe" },
      { statusRega: "sucesso", ultimaRega: new Date() },
      { new: true }
    );
    res.json({ message: "Rega registrada!", dados: planta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/clima', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    const apiKey = process.env.WEATHER_API_KEY;

    // 1. Chamada para pegar o clima (onde vem a temperatura)
    const urlWeather = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br`;
    
    // 2. Chamada para a Geo API (onde vem o nome detalhado da cidade e estado)
    const urlGeo = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;

    const [weatherRes, geoRes] = await Promise.all([
      axios.get(urlWeather),
      axios.get(urlGeo)
    ]);

    const tempAtual = Math.round(weatherRes.data.main.temp);
    const bairro = weatherRes.data.name;
    const cidade = geoRes.data[0]?.local_names?.pt || geoRes.data[0]?.name;
    const iconeCodigo = weatherRes.data.weather[0].icon;

    // Enviando para o Frontend
    res.json({ 
      temperatura: tempAtual, 
      bairro: bairro,
      cidade: cidade ,
      icone: iconeCodigo
    });
  } catch (error) {
    console.error("Erro na API de Clima/Geo:", error.message);
    res.status(500).json({ error: "Erro ao buscar localização" });
  }
});

app.listen(3001, () => console.log("🚀 Servidor em http://localhost:3001"));