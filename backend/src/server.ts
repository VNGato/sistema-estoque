import express from 'express';
import cors from 'cors';
import { router } from './routes';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

// Usar nossas rotas
app.use(router);

app.listen(PORT, () => {
    console.log(`🔥 Servidor rodando em http://localhost:${PORT}`);
});