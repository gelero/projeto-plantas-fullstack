import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import axios from 'axios';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Lembre-se de criar a pasta "uploads" na raiz do backend
  },
  filename: (req, file, cb) => {
    // Cria um nome único: data-nomeoriginal.extensao
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ CONECTADO AO MONGODB ATLAS"))
  .catch(err => console.error("❌ ERRO DE CONEXÃO:", err));

const PlantaSchema = new mongoose.Schema({
  nome: String,
  especie: String,
  probabilidade: Number,
  imagemOriginal: String,
  statusRega: String,
  ultimaRega: Date,
  historico: [{
    data: { type: Date, default: Date.now },
    tipo: { type: String, default: "Rega Manual" }
  }],
  temperatura: Number,
  imagem: String,
  userId: mongoose.Schema.Types.ObjectId // Para ligar a planta ao usuário dono
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

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, nome: user.nome, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/planta', async (req, res) => {
  try {
    const planta = await Planta.findOne().sort({ _id: -1 });

    if (!planta) {
      return res.status(404).json({ message: "Nenhuma planta cadastrada ainda." });
    }

    res.json(planta);
  } catch (err) {
    console.error("❌ ERRO NA ROTA GET:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plantas', upload.single('imagem'), async (req, res) => {
  try {
    const { nome, especie, userId, statusRega, temperatura, probabilidade } = req.body;

    let imagemUrl = "https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=500";

    if (req.file) {
      // 1. Envia o arquivo para o Cloudinary
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: 'meu-jardim',
      });

      imagemUrl = uploadRes.secure_url;
      fs.unlinkSync(req.file.path);
    }

    const novaPlanta = new Planta({
      nome,
      especie,
      probabilidade: probabilidade || 1,
      imagemOriginal: imagemUrl,
      imagem: imagemUrl,
      statusRega: statusRega || "pendente",
      ultimaRega: new Date(),
      historico: [],
      temperatura: temperatura || 0,
      userId: (userId && userId !== "undefined") ? userId : null
    });

    await novaPlanta.save();
    res.status(201).json({ message: "Planta cadastrada com sucesso!", dados: novaPlanta });
  } catch (err) {
    console.error("❌ Erro no upload/cadastro:", err);
    res.status(500).json({ error: "Erro ao processar imagem ou salvar planta." });
  }
});

app.post('/api/regar', async (req, res) => {
  try {
    const { plantaId } = req.body; // Recebe o ID vindo do App.jsx
    const agora = new Date();

    const planta = await Planta.findByIdAndUpdate(
      plantaId,
      {
        $set: { statusRega: "sucesso", ultimaRega: agora },
        $push: { historico: { $each: [{ data: agora }], $slice: -5 } }
      },
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
      cidade: cidade,
      icone: iconeCodigo
    });
  } catch (error) {
    console.error("Erro na API de Clima/Geo:", error.message);
    res.status(500).json({ error: "Erro ao buscar localização" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});