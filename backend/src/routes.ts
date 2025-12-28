import { Router } from 'express';
import { ProductController } from './controllers/ProductController';

const router = Router();
const productController = new ProductController();

// Rotas
router.post('/products', productController.create);
router.get('/products', productController.list);
router.post('/products/:id/sell', productController.sell);     // Diminuir
router.post('/products/:id/restock', productController.restock); // <--- ESTA LINHA É OBRIGATÓRIA PARA O (+)
router.delete('/products/:id', productController.delete);
router.put('/products/:id', productController.update); // <--- ROTA DE EDIÇÃO
router.post('/shutdown', productController.shutdown);

export { router };